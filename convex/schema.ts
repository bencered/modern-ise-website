import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
  }).index("email", ["email"]),

  loginAttempts: defineTable({
    ip: v.string(),
    timestamp: v.number(),
  }).index("by_ip_and_time", ["ip", "timestamp"]),

  allowedEmails: defineTable({
    email: v.string(),
    name: v.string(),
    addedAt: v.number(),
  }).index("by_email", ["email"]),

  companies: defineTable({
    name: v.string(),
    slug: v.string(),
    imageId: v.optional(v.id("_storage")),
    website: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())), // Slugs of merged companies
    createdAt: v.number(),
    // Enhanced fields for company pages
    description: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    wikipediaUrl: v.optional(v.string()),
    glassdoorUrl: v.optional(v.string()),
    industry: v.optional(v.string()),
    headquarters: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  residencies: defineTable({
    externalId: v.string(),
    name: v.string(),
    residencyType: v.string(),
    residencyTitle: v.string(),
    jobTitle: v.string(),
    description: v.optional(v.string()),
    emailAddress: v.optional(v.string()),
    monthlySalary: v.optional(v.string()),
    accommodationSupport: v.optional(v.string()),
    location: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    createdAt: v.string(),
    syncedAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_type", ["residencyType"])
    .index("by_company", ["companyId"]),

  testimonials: defineTable({
    content: v.string(),
    rating: v.optional(v.number()), // 1-5 stars
    companyId: v.id("companies"),
    residencyId: v.optional(v.id("residencies")), // Optional specific residency
    userId: v.id("users"),
    authorName: v.string(), // Display name (or "Anonymous" if isAnonymous)
    isAnonymous: v.optional(v.boolean()), // Hide author name on frontend
    residencyYear: v.optional(v.string()), // e.g., "R1 2024"
    status: v.string(), // "pending" | "approved" | "rejected"
    isFeatured: v.boolean(),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_featured", ["companyId", "isFeatured"]),

  userRatings: defineTable({
    userId: v.id("users"),
    residencyId: v.id("residencies"),
    rating: v.number(), // 1-5 stars
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_residency", ["userId", "residencyId"]),

  companyRankings: defineTable({
    userId: v.id("users"),
    category: v.string(), // "r1_only" | "r2_only" | "r1_r2" | "all_r1_r2" | "r3_r4_r5" | "all"
    rankings: v.array(v.id("companies")), // Ordered array (index 0 = rank 1)
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"]),
});
