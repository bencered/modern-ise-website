import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./ResendOTP";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      const email = args.profile.email?.toLowerCase();

      if (!email) {
        throw new Error("Email is required");
      }

      // Check allowlist - reject if not found
      const allowed = await ctx.db
        .query("allowedEmails")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (!allowed) {
        throw new Error(
          "Email not authorized. Only ISE students can sign in."
        );
      }

      // If user exists, return their ID
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // Check if user already exists by email
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();

      if (existingUser) {
        return existingUser._id;
      }

      // Create new user
      return ctx.db.insert("users", {
        email,
        name: allowed.name,
        emailVerificationTime: Date.now(),
      });
    },
  },
});
