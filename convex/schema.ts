import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  companies: defineTable({
    name: v.string(),
    slug: v.string(),
    imageId: v.optional(v.id("_storage")),
    website: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())), // Slugs of merged companies
    createdAt: v.number(),
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
});
