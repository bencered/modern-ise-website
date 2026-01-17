import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get company by slug with image URL
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!company) return null;

    let imageUrl = null;
    if (company.imageId) {
      imageUrl = await ctx.storage.getUrl(company.imageId);
    }

    return { ...company, imageUrl };
  },
});

// Company + residencies + featured testimonial (requires auth to see testimonial)
export const getWithResidencies = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!company) return null;

    let imageUrl = null;
    if (company.imageId) {
      imageUrl = await ctx.storage.getUrl(company.imageId);
    }

    // Get residencies for this company
    const residencies = await ctx.db
      .query("residencies")
      .withIndex("by_company", (q) => q.eq("companyId", company._id))
      .collect();

    // Get most recent approved testimonial only if user is authenticated
    let featuredTestimonial = null;
    const userId = await getAuthUserId(ctx);
    if (userId) {
      const testimonials = await ctx.db
        .query("testimonials")
        .withIndex("by_company_status", (q) =>
          q.eq("companyId", company._id).eq("status", "approved")
        )
        .collect();

      if (testimonials.length > 0) {
        featuredTestimonial = testimonials.sort((a, b) => b.createdAt - a.createdAt)[0];
      }
    }

    return {
      ...company,
      imageUrl,
      residencies,
      featuredTestimonial,
    };
  },
});

// List all companies with residency counts
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();

    const companiesWithData = await Promise.all(
      companies.map(async (company) => {
        let imageUrl = null;
        if (company.imageId) {
          imageUrl = await ctx.storage.getUrl(company.imageId);
        }

        // Count residencies for this company
        const residencies = await ctx.db
          .query("residencies")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

        return {
          ...company,
          imageUrl,
          residencyCount: residencies.length,
        };
      })
    );

    return companiesWithData.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Admin: update company metadata
export const updateDetails = mutation({
  args: {
    adminPassword: v.string(),
    companyId: v.id("companies"),
    description: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    wikipediaUrl: v.optional(v.string()),
    glassdoorUrl: v.optional(v.string()),
    industry: v.optional(v.string()),
    headquarters: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new Error("Invalid admin password");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    const updates: Record<string, string | undefined> = {};

    if (args.description !== undefined)
      updates.description = args.description || undefined;
    if (args.linkedinUrl !== undefined)
      updates.linkedinUrl = args.linkedinUrl || undefined;
    if (args.wikipediaUrl !== undefined)
      updates.wikipediaUrl = args.wikipediaUrl || undefined;
    if (args.glassdoorUrl !== undefined)
      updates.glassdoorUrl = args.glassdoorUrl || undefined;
    if (args.industry !== undefined)
      updates.industry = args.industry || undefined;
    if (args.headquarters !== undefined)
      updates.headquarters = args.headquarters || undefined;
    if (args.website !== undefined) updates.website = args.website || undefined;

    await ctx.db.patch(args.companyId, updates);

    return { success: true };
  },
});

// Get company details for admin editing
export const getForAdmin = query({
  args: {
    adminPassword: v.string(),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    if (args.adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new Error("Invalid admin password");
    }

    const company = await ctx.db.get(args.companyId);
    if (!company) return null;

    let imageUrl = null;
    if (company.imageId) {
      imageUrl = await ctx.storage.getUrl(company.imageId);
    }

    // Count residencies
    const residencies = await ctx.db
      .query("residencies")
      .withIndex("by_company", (q) => q.eq("companyId", company._id))
      .collect();

    // Count testimonials
    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_company", (q) => q.eq("companyId", company._id))
      .collect();

    const approvedCount = testimonials.filter(
      (t) => t.status === "approved"
    ).length;
    const pendingCount = testimonials.filter(
      (t) => t.status === "pending"
    ).length;

    return {
      ...company,
      imageUrl,
      residencyCount: residencies.length,
      testimonialStats: {
        total: testimonials.length,
        approved: approvedCount,
        pending: pendingCount,
      },
    };
  },
});
