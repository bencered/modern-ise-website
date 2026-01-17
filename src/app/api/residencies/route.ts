import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per minute
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 1000);

interface Residency {
  _id: string;
  name: string;
  residencyType: string;
  residencyTitle: string;
  jobTitle: string;
  description?: string;
  emailAddress?: string;
  monthlySalary?: string;
  accommodationSupport?: string;
  location?: string;
  createdAt: string;
  company: {
    _id: string;
    name: string;
    slug: string;
    website?: string;
    imageUrl?: string | null;
  } | null;
}

function formatResidencyForApi(r: Residency) {
  return {
    id: r._id,
    name: r.name,
    residencyType: r.residencyType,
    residencyTitle: r.residencyTitle,
    jobTitle: r.jobTitle,
    description: r.description,
    emailAddress: r.emailAddress,
    monthlySalary: r.monthlySalary,
    accommodationSupport: r.accommodationSupport,
    location: r.location,
    createdAt: r.createdAt,
    company: r.company
      ? {
          name: r.company.name,
          website: r.company.website,
          imageUrl: r.company.imageUrl,
        }
      : null,
  };
}

function formatResidenciesMarkdown(residencies: Residency[]): string {
  const lines = ["# ISE Residencies\n"];

  for (const r of residencies) {
    const companyName = r.company?.name || r.name.split("|")[1]?.trim() || r.name;
    lines.push(`## ${companyName} - ${r.jobTitle}`);
    lines.push(
      `**Type:** ${r.residencyType}${r.location ? ` | **Location:** ${r.location}` : ""}${r.monthlySalary ? ` | **Salary:** ${r.monthlySalary.split("\n")[0]}` : ""}`
    );
    lines.push("");
    if (r.description) {
      lines.push(r.description.slice(0, 500) + (r.description.length > 500 ? "..." : ""));
      lines.push("");
    }
    const contactParts = [];
    if (r.emailAddress) contactParts.push(`**Apply:** ${r.emailAddress}`);
    if (r.company?.website) contactParts.push(`**Website:** ${r.company.website}`);
    if (contactParts.length) lines.push(contactParts.join(" | "));
    lines.push("\n---\n");
  }

  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  // Check rate limit
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `Too many requests. Retry after ${retryAfter} seconds.`,
          retryAfter,
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;
  const location = searchParams.get("location") || undefined;
  const format = searchParams.get("format") || "json";
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 100);

  // Validate type parameter
  const validTypes = ["R1", "R1+R2", "R2", "R3", "R4"];
  if (type && !validTypes.includes(type)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAMETER",
          message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        },
      },
      { status: 400 }
    );
  }

  try {
    // Fetch all residencies from Convex
    const residencies = (await convex.query(api.residencies.list)) as Residency[];

    // Filter
    let filtered = residencies;
    if (type) {
      filtered = filtered.filter((r) => r.residencyType === type);
    }
    if (location) {
      const locationLower = location.toLowerCase();
      filtered = filtered.filter((r) =>
        r.location?.toLowerCase().includes(locationLower)
      );
    }

    // Paginate
    const paginated = filtered.slice(0, limit);

    // Cache headers - 5 minutes public cache, 1 hour stale-while-revalidate
    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    };

    // Return based on format
    if (format === "markdown") {
      return new NextResponse(formatResidenciesMarkdown(paginated), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          ...cacheHeaders,
        },
      });
    }

    return NextResponse.json(
      {
        data: paginated.map(formatResidencyForApi),
        meta: { total: filtered.length, returned: paginated.length },
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch residencies",
        },
      },
      { status: 500 }
    );
  }
}
