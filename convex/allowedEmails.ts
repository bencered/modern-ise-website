import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const bulkImport = mutation({
  args: {
    adminPassword: v.string(),
    emails: v.array(
      v.object({
        email: v.string(),
        name: v.string(),
      })
    ),
  },
  handler: async (ctx, { adminPassword, emails }) => {
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new Error("Unauthorized");
    }

    let added = 0;
    let skipped = 0;

    for (const { email, name } of emails) {
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await ctx.db
        .query("allowedEmails")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .first();

      if (!existing) {
        await ctx.db.insert("allowedEmails", {
          email: normalizedEmail,
          name: name.trim(),
          addedAt: Date.now(),
        });
        added++;
      } else {
        skipped++;
      }
    }

    return { added, skipped };
  },
});

export const addEmail = mutation({
  args: {
    adminPassword: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { adminPassword, email, name }) => {
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new Error("Unauthorized");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await ctx.db
      .query("allowedEmails")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      throw new Error("Email already in allowlist");
    }

    await ctx.db.insert("allowedEmails", {
      email: normalizedEmail,
      name: name.trim(),
      addedAt: Date.now(),
    });

    return { success: true };
  },
});

export const removeEmail = mutation({
  args: {
    adminPassword: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { adminPassword, email }) => {
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new Error("Unauthorized");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await ctx.db
      .query("allowedEmails")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!existing) {
      throw new Error("Email not found in allowlist");
    }

    await ctx.db.delete(existing._id);

    return { success: true };
  },
});

export const isEmailAllowed = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const allowed = await ctx.db
      .query("allowedEmails")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    return !!allowed;
  },
});

export const listAllowedEmails = query({
  args: {
    adminPassword: v.string(),
  },
  handler: async (ctx, { adminPassword }) => {
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.query("allowedEmails").collect();
  },
});
