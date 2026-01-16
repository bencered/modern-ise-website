import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple in-memory rate limiter (shared state won't work across serverless instances,
// but provides basic protection)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 120; // requests per minute (higher for single item)
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

function formatResidencyMarkdown(r: Residency): string {
  const companyName = r.company?.name || r.name.split("|")[1]?.trim() || r.name;
  const lines = [`# ${companyName} - ${r.jobTitle}\n`];
  lines.push(`**Residency Type:** ${r.residencyType}`);
  lines.push(`**Title:** ${r.residencyTitle}`);
  if (r.location) lines.push(`**Location:** ${r.location}`);
  if (r.monthlySalary) lines.push(`**Salary:** ${r.monthlySalary}`);
  if (r.accommodationSupport) lines.push(`**Accommodation:** ${r.accommodationSupport}`);
  lines.push("");
  if (r.description) {
    lines.push("## Description\n");
    lines.push(r.description);
    lines.push("");
  }
  lines.push("## Contact\n");
  if (r.emailAddress) lines.push(`**Email:** ${r.emailAddress}`);
  if (r.company?.website) lines.push(`**Website:** ${r.company.website}`);
  lines.push(`\n*Posted: ${r.createdAt}*`);
  return lines.join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAMETER",
          message: "Residency ID is required",
        },
      },
      { status: 400 }
    );
  }

  // Parse format param
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  try {
    const residency = (await convex.query(api.residencies.getById, {
      id: id as Id<"residencies">,
    })) as Residency | null;

    if (!residency) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Residency not found",
          },
        },
        { status: 404 }
      );
    }

    if (format === "markdown") {
      return new NextResponse(formatResidencyMarkdown(residency), {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    }

    return NextResponse.json({ data: formatResidencyForApi(residency) });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAMETER",
          message: "Invalid residency ID format",
        },
      },
      { status: 400 }
    );
  }
}
