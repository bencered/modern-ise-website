"use server";

import { headers } from "next/headers";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

export async function checkOtpRateLimitWithIp(email: string) {
  const headersList = await headers();

  // Get client IP from various headers (Vercel, Cloudflare, etc.)
  const clientIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") ||
    "unknown";

  await fetchMutation(api.rateLimit.checkOtpRateLimit, {
    email,
    clientIp,
  });

  return { ok: true };
}
