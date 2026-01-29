import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Export all user data (GDPR data subject access request)
export const exportMyData = query({
  args: {},
  returns: v.object({
    exportedAt: v.string(),
    profile: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      createdAt: v.union(v.string(), v.null()),
    }),
    testimonials: v.array(
      v.object({
        content: v.string(),
        rating: v.number(),
        companyName: v.string(),
        authorName: v.string(),
        isAnonymous: v.boolean(),
        residencyYear: v.string(),
        status: v.string(),
        createdAt: v.string(),
      })
    ),
    ratings: v.array(
      v.object({
        residencyName: v.string(),
        rating: v.number(),
        updatedAt: v.string(),
      })
    ),
    companyRankings: v.array(
      v.object({
        category: v.string(),
        rankings: v.array(
          v.object({
            rank: v.number(),
            companyName: v.string(),
          })
        ),
        updatedAt: v.string(),
      })
    ),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Get user profile
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's testimonials
    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich testimonials with company names
    const enrichedTestimonials = await Promise.all(
      testimonials.map(async (t) => {
        const company = await ctx.db.get(t.companyId);
        return {
          content: t.content,
          rating: t.rating ?? 0,
          companyName: company?.name ?? "Unknown",
          authorName: t.authorName,
          isAnonymous: t.isAnonymous ?? false,
          residencyYear: t.residencyYear ?? "",
          status: t.status,
          createdAt: new Date(t.createdAt).toISOString(),
        };
      })
    );

    // Get user's ratings
    const ratings = await ctx.db
      .query("userRatings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Enrich ratings with residency names
    const enrichedRatings = await Promise.all(
      ratings.map(async (r) => {
        const residency = await ctx.db.get(r.residencyId);
        return {
          residencyName: residency?.name ?? "Unknown",
          rating: r.rating,
          updatedAt: new Date(r.updatedAt).toISOString(),
        };
      })
    );

    // Get user's company rankings
    const rankings = await ctx.db
      .query("companyRankings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Collect all unique company IDs from rankings to batch-fetch
    const allCompanyIds = [...new Set(rankings.flatMap((r) => r.rankings))];
    const companiesMap = new Map<string, string>();
    await Promise.all(
      allCompanyIds.map(async (companyId) => {
        const company = await ctx.db.get(companyId);
        companiesMap.set(companyId, company?.name ?? "Unknown");
      })
    );

    // Enrich rankings with company names (using pre-fetched data)
    const enrichedRankings = rankings.map((r) => ({
      category: r.category,
      rankings: r.rankings.map((companyId, index) => ({
        rank: index + 1,
        companyName: companiesMap.get(companyId) ?? "Unknown",
      })),
      updatedAt: new Date(r.updatedAt).toISOString(),
    }));

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        name: user.name,
        email: user.email,
        createdAt: user._creationTime
          ? new Date(user._creationTime).toISOString()
          : null,
      },
      testimonials: enrichedTestimonials,
      ratings: enrichedRatings,
      companyRankings: enrichedRankings,
    };
  },
});

// Delete user account and all associated data (GDPR right to erasure)
export const deleteMyAccount = mutation({
  args: {},
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete all user's testimonials
    const testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const testimonial of testimonials) {
      await ctx.db.delete(testimonial._id);
    }

    // Delete all user's ratings
    const ratings = await ctx.db
      .query("userRatings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const rating of ratings) {
      await ctx.db.delete(rating._id);
    }

    // Delete all user's company rankings
    const rankings = await ctx.db
      .query("companyRankings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const ranking of rankings) {
      await ctx.db.delete(ranking._id);
    }

    // Delete auth sessions for this user
    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    for (const session of authSessions) {
      await ctx.db.delete(session._id);
    }

    // Delete auth accounts for this user
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();

    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // Finally, delete the user record
    await ctx.db.delete(userId);

    return { success: true };
  },
});
