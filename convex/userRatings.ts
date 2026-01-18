import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all ratings for authenticated user as Record<residencyId, rating>
export const getMyRatings = query({
  args: {},
  returns: v.record(v.string(), v.number()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return {};

    const ratings = await ctx.db
      .query("userRatings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const result: Record<string, number> = {};
    for (const r of ratings) {
      result[r.residencyId] = r.rating;
    }
    return result;
  },
});

// Set or update a rating (upsert logic)
export const setRating = mutation({
  args: {
    residencyId: v.id("residencies"),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Validate rating range
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if residency exists
    const residency = await ctx.db.get(args.residencyId);
    if (!residency) {
      throw new Error("Residency not found");
    }

    // Check if rating already exists
    const existing = await ctx.db
      .query("userRatings")
      .withIndex("by_user_residency", (q) =>
        q.eq("userId", userId).eq("residencyId", args.residencyId)
      )
      .first();

    if (existing) {
      // Update existing rating
      await ctx.db.patch(existing._id, {
        rating: args.rating,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new rating
      return await ctx.db.insert("userRatings", {
        userId,
        residencyId: args.residencyId,
        rating: args.rating,
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete a rating
export const clearRating = mutation({
  args: {
    residencyId: v.id("residencies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const existing = await ctx.db
      .query("userRatings")
      .withIndex("by_user_residency", (q) =>
        q.eq("userId", userId).eq("residencyId", args.residencyId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true };
    }

    return { success: false };
  },
});

// Bulk import from localStorage on first login
// Server wins on conflict - preserves cross-device data
export const importRatings = mutation({
  args: {
    ratings: v.record(v.string(), v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    let imported = 0;
    let skipped = 0;

    for (const [residencyIdStr, rating] of Object.entries(args.ratings)) {
      // Skip invalid ratings
      if (rating < 1 || rating > 5) continue;

      // Validate residency ID format and existence
      let residencyId;
      try {
        residencyId = residencyIdStr as typeof args.ratings extends Record<infer K, number> ? K : never;
      } catch {
        continue;
      }

      // Check if rating already exists (server wins)
      const existing = await ctx.db
        .query("userRatings")
        .withIndex("by_user_residency", (q) =>
          q.eq("userId", userId).eq("residencyId", residencyId as any)
        )
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Create new rating
      await ctx.db.insert("userRatings", {
        userId,
        residencyId: residencyId as any,
        rating,
        updatedAt: Date.now(),
      });
      imported++;
    }

    return { imported, skipped };
  },
});
