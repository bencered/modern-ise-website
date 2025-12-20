import { ConvexError, v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Rate limit config: max 5 attempts per 15 minutes
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function validateAdminPassword(password: string | undefined) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new ConvexError("ADMIN_PASSWORD environment variable is not set");
  }

  if (!password || password !== adminPassword) {
    throw new ConvexError("Invalid admin password");
  }
}

export const verifyPassword = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    // Count recent attempts (using "global" as identifier since we can't get client IP)
    const recentAttempts = await ctx.db
      .query("loginAttempts")
      .withIndex("by_ip_and_time", (q) =>
        q.eq("ip", "global").gt("timestamp", windowStart)
      )
      .collect();

    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const oldestAttempt = recentAttempts[0];
      const retryAfter = Math.ceil((oldestAttempt.timestamp + WINDOW_MS - now) / 1000);
      throw new ConvexError(`Too many login attempts. Try again in ${retryAfter} seconds.`);
    }

    // Record this attempt
    await ctx.db.insert("loginAttempts", {
      ip: "global",
      timestamp: now,
    });

    // Validate password
    try {
      validateAdminPassword(args.password);
    } catch (e) {
      // Password failed - keep the attempt recorded
      throw e;
    }

    // Password correct - clean up attempts for this session
    for (const attempt of recentAttempts) {
      await ctx.db.delete(attempt._id);
    }

    // Schedule cleanup of old attempts
    await ctx.scheduler.runAfter(0, internal.admin.cleanupOldAttempts, {});

    return { success: true };
  },
});

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
