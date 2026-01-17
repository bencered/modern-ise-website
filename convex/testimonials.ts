import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";
import { requireAdmin } from "./lib/requireAdmin";

// Sanitize testimonial for public consumption - never expose userId
function sanitizeTestimonial(t: Doc<"testimonials">) {
  return {
    _id: t._id,
    content: t.content,
    rating: t.rating,
    companyId: t.companyId,
    authorName: t.isAnonymous ? "Anonymous" : t.authorName,
    isAnonymous: t.isAnonymous ?? false,
    isFeatured: t.isFeatured,
    residencyYear: t.residencyYear,
    createdAt: t.createdAt,
  };
}

// Get all approved testimonials (auth required to view)
// Redacts user info for anonymous testimonials
export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    // Enrich with company data and redact user info for anonymous testimonials
    const enriched = await Promise.all(
      testimonials.map(async (t) => {
        const company = await ctx.db.get(t.companyId);
        let imageUrl = null;
        if (company?.imageId) {
          imageUrl = await ctx.storage.getUrl(company.imageId);
        }

        // Return sanitized data - never expose userId to frontend
        return {
          _id: t._id,
          content: t.content,
          rating: t.rating,
          companyId: t.companyId,
          authorName: t.isAnonymous ? "Anonymous" : t.authorName,
          isAnonymous: t.isAnonymous ?? false,
          residencyYear: t.residencyYear,
          createdAt: t.createdAt,
          company: company ? { ...company, imageUrl } : null,
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get approved testimonials for a company (auth required to view)
// Returns sanitized data - never exposes userId
export const listByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", "approved")
      )
      .collect();

    // Sanitize to prevent data leaks (userId, real name for anonymous)
    return testimonials
      .map(sanitizeTestimonial)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get most recent approved testimonial for a company
// Returns sanitized data - never exposes userId
export const getFeaturedByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", args.companyId).eq("status", "approved")
      )
      .collect();

    if (testimonials.length === 0) return null;

    // Return most recent, sanitized
    const mostRecent = testimonials.sort((a, b) => b.createdAt - a.createdAt)[0];
    return sanitizeTestimonial(mostRecent);
  },
});

// Admin: get all pending testimonials
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Enrich with company data
    const enriched = await Promise.all(
      testimonials.map(async (t) => {
        const company = await ctx.db.get(t.companyId);
        return { ...t, company };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Admin: get all testimonials (for the admin panel)
export const listAll = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let testimonials;
    if (args.status) {
      testimonials = await ctx.db
        .query("testimonials")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      testimonials = await ctx.db.query("testimonials").collect();
    }

    // Enrich with company data
    const enriched = await Promise.all(
      testimonials.map(async (t) => {
        const company = await ctx.db.get(t.companyId);
        return { ...t, company };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// User's own testimonials
export const getMyTestimonials = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich with company data
    const enriched = await Promise.all(
      testimonials.map(async (t) => {
        const company = await ctx.db.get(t.companyId);
        return { ...t, company };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Submit new testimonial (auth required)
export const submit = mutation({
  args: {
    content: v.string(),
    rating: v.optional(v.number()),
    companyId: v.id("companies"),
    residencyId: v.optional(v.id("residencies")),
    residencyYear: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Validate content length
    if (args.content.length > 500) {
      throw new Error("Testimonial must be 500 characters or less");
    }

    if (args.content.trim().length < 10) {
      throw new Error("Testimonial must be at least 10 characters");
    }

    // Validate rating
    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Validate residencyYear length (server-side validation to match client-side maxLength)
    if (args.residencyYear && args.residencyYear.length > 20) {
      throw new Error("Residency year must be 20 characters or less");
    }

    // Global rate limiting: max 5 pending testimonials per user
    const userPendingTestimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    if (userPendingTestimonials.length >= 5) {
      throw new Error(
        "You have too many pending testimonials. Please wait for some to be reviewed before submitting more."
      );
    }

    // Check for existing pending testimonial from this user for this company
    const existingPendingForCompany = userPendingTestimonials.find(
      (t) => t.companyId === args.companyId
    );

    if (existingPendingForCompany) {
      throw new Error(
        "You already have a pending testimonial for this company"
      );
    }

    // Get user's name (stored internally even if anonymous)
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Store real name internally, display "Anonymous" if requested
    const realName = user.name || user.email || "Anonymous";
    const authorName = args.isAnonymous ? "Anonymous" : realName;

    return await ctx.db.insert("testimonials", {
      content: args.content.trim(),
      rating: args.rating,
      companyId: args.companyId,
      residencyId: args.residencyId,
      userId,
      authorName,
      isAnonymous: args.isAnonymous ?? false,
      residencyYear: args.residencyYear,
      status: "pending",
      isFeatured: false,
      createdAt: Date.now(),
    });
  },
});

// Admin: approve testimonial
export const approve = mutation({
  args: {
    testimonialId: v.id("testimonials"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    await ctx.db.patch(args.testimonialId, {
      status: "approved",
      approvedAt: Date.now(),
    });

    return { success: true };
  },
});

// Admin: reject testimonial
export const reject = mutation({
  args: {
    testimonialId: v.id("testimonials"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    await ctx.db.patch(args.testimonialId, {
      status: "rejected",
    });

    return { success: true };
  },
});

// Admin: set as featured for company (only one featured per company)
export const setFeatured = mutation({
  args: {
    testimonialId: v.id("testimonials"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    if (testimonial.status !== "approved") {
      throw new Error("Only approved testimonials can be featured");
    }

    // Unset any existing featured testimonial for this company
    const existingFeatured = await ctx.db
      .query("testimonials")
      .withIndex("by_featured", (q) =>
        q.eq("companyId", testimonial.companyId).eq("isFeatured", true)
      )
      .collect();

    for (const t of existingFeatured) {
      await ctx.db.patch(t._id, { isFeatured: false });
    }

    // Set this one as featured
    await ctx.db.patch(args.testimonialId, { isFeatured: true });

    return { success: true };
  },
});

// Admin: unset featured
export const unsetFeatured = mutation({
  args: {
    testimonialId: v.id("testimonials"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    await ctx.db.patch(args.testimonialId, { isFeatured: false });

    return { success: true };
  },
});

// Delete testimonial (user can delete own, admin can delete any)
export const deleteTestimonial = mutation({
  args: {
    testimonialId: v.id("testimonials"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) {
      throw new Error("Testimonial not found");
    }

    // Check if admin or owner
    const user = await ctx.db.get(userId);
    const isAdmin = user?.isAdmin;

    if (!isAdmin && testimonial.userId !== userId) {
      throw new Error("You can only delete your own testimonials");
    }

    await ctx.db.delete(args.testimonialId);
    return { success: true };
  },
});
