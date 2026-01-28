import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get rankings for a specific category
export const getRankings = query({
  args: {
    category: v.string(),
  },
  returns: v.array(v.id("companies")),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const ranking = await ctx.db
      .query("companyRankings")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", userId).eq("category", args.category)
      )
      .first();

    return ranking?.rankings || [];
  },
});

// Get all rankings for the authenticated user
export const getAllRankings = query({
  args: {},
  returns: v.record(v.string(), v.array(v.id("companies"))),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return {};

    const rankings = await ctx.db
      .query("companyRankings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const result: Record<string, typeof rankings[0]["rankings"]> = {};
    for (const r of rankings) {
      result[r.category] = r.rankings;
    }
    return result;
  },
});

// Save or update rankings for a category
export const saveRankings = mutation({
  args: {
    category: v.string(),
    rankings: v.array(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Validate category
    const validCategories = ["r1_only", "r2_only", "r1_r2", "all_r1_r2", "r3", "r4", "r5", "all"];
    if (!validCategories.includes(args.category)) {
      throw new Error("Invalid category");
    }

    // Check if ranking already exists
    const existing = await ctx.db
      .query("companyRankings")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", userId).eq("category", args.category)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rankings: args.rankings,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("companyRankings", {
        userId,
        category: args.category,
        rankings: args.rankings,
        updatedAt: Date.now(),
      });
    }
  },
});

// Clear rankings for a category
export const clearRankings = mutation({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const existing = await ctx.db
      .query("companyRankings")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", userId).eq("category", args.category)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true };
    }

    return { success: false };
  },
});

// Bulk import rankings from localStorage on first login
export const importRankings = mutation({
  args: {
    rankings: v.record(v.string(), v.array(v.id("companies"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const validCategories = ["r1_only", "r2_only", "r1_r2", "all_r1_r2", "r3", "r4", "r5", "all"];
    let imported = 0;
    let skipped = 0;

    for (const [category, rankingsList] of Object.entries(args.rankings)) {
      if (!validCategories.includes(category)) continue;

      // Check if ranking already exists (server wins)
      const existing = await ctx.db
        .query("companyRankings")
        .withIndex("by_user_category", (q) =>
          q.eq("userId", userId).eq("category", category)
        )
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("companyRankings", {
        userId,
        category,
        rankings: rankingsList,
        updatedAt: Date.now(),
      });
      imported++;
    }

    return { imported, skipped };
  },
});
