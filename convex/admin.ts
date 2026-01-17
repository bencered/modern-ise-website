import { ConvexError } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";

/**
 * Check if the current user is an admin.
 * Returns the user if they are an admin, throws otherwise.
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { isAdmin: false };
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return { isAdmin: false };
    }

    const isAdmin = (user as Doc<"users"> & { isAdmin?: boolean }).isAdmin ?? false;
    return { isAdmin };
  },
});

/**
 * Internal query to check admin status for use in actions.
 */
export const checkAdminStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const isAdmin = (user as Doc<"users"> & { isAdmin?: boolean }).isAdmin ?? false;
    if (!isAdmin) {
      throw new ConvexError("Admin access required");
    }

    return { isAdmin: true };
  },
});

// Cleanup old login attempts (legacy - kept for scheduled job compatibility)
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const cleanupOldAttempts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - WINDOW_MS;
    const oldAttempts = await ctx.db
      .query("loginAttempts")
      .withIndex("by_ip_and_time", (q) =>
        q.eq("ip", "global").lt("timestamp", cutoff)
      )
      .collect();

    for (const attempt of oldAttempts) {
      await ctx.db.delete(attempt._id);
    }
  },
});
