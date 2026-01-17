import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Global limit: protect Resend credits (max 100 emails per hour globally)
  sendOtpGlobal: { kind: "fixed window", rate: 100, period: HOUR },

  // Per-email limit: prevent spamming a specific email (max 3 per 15 min)
  sendOtpPerEmail: { kind: "token bucket", rate: 3, period: 15 * MINUTE, capacity: 3 },

  // Per-IP limit: prevent brute-forcing the email list (max 10 attempts per 15 min)
  sendOtpPerIp: { kind: "token bucket", rate: 10, period: 15 * MINUTE, capacity: 10 },
});

// Pre-check mutation - call this before signIn to enforce rate limits
export const checkOtpRateLimit = mutation({
  args: {
    email: v.string(),
    clientIp: v.optional(v.string()),
  },
  handler: async (ctx, { email, clientIp }) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Check global limit first
    const globalStatus = await rateLimiter.limit(ctx, "sendOtpGlobal");
    if (!globalStatus.ok) {
      throw new Error(
        `Too many verification requests. Please try again in ${Math.ceil((globalStatus.retryAfter ?? 0) / 1000 / 60)} minutes.`
      );
    }

    // Check per-email limit
    const emailStatus = await rateLimiter.limit(ctx, "sendOtpPerEmail", {
      key: normalizedEmail,
    });
    if (!emailStatus.ok) {
      throw new Error(
        `Too many codes sent to this email. Please try again in ${Math.ceil((emailStatus.retryAfter ?? 0) / 1000 / 60)} minutes.`
      );
    }

    // Check per-IP limit if IP is provided
    if (clientIp) {
      const ipStatus = await rateLimiter.limit(ctx, "sendOtpPerIp", {
        key: clientIp,
      });
      if (!ipStatus.ok) {
        throw new Error(
          `Too many attempts from your location. Please try again in ${Math.ceil((ipStatus.retryAfter ?? 0) / 1000 / 60)} minutes.`
        );
      }
    }

    return { ok: true };
  },
});
