import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractCompanyName(name: string): string {
  const parts = name.split("|");
  if (parts.length > 1) {
    return parts[1].trim().replace(/[\s_-]*\d+$/, "").trim();
  }
  return name;
}

export const upsertResidencies = internalMutation({
  args: {
    records: v.array(
      v.object({
        externalId: v.string(),
        name: v.string(),
        residencyType: v.string(),
        residencyTitle: v.string(),
        jobTitle: v.string(),
        description: v.optional(v.string()),
        emailAddress: v.optional(v.string()),
        monthlySalary: v.optional(v.string()),
        accommodationSupport: v.optional(v.string()),
        createdAt: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const syncedAt = Date.now();

    for (const record of args.records) {
      // Extract and upsert company
      const companyName = extractCompanyName(record.name);
      const companySlug = slugify(companyName);

      // First try to find by exact slug match
      let company = await ctx.db
        .query("companies")
        .withIndex("by_slug", (q) => q.eq("slug", companySlug))
        .unique();

      // If not found, check if this slug is an alias for another company
      if (!company) {
        const allCompanies = await ctx.db.query("companies").collect();
        company = allCompanies.find(
          (c) => c.aliases && c.aliases.includes(companySlug)
        ) || null;
      }

      if (!company) {
        const companyId = await ctx.db.insert("companies", {
          name: companyName,
          slug: companySlug,
          createdAt: Date.now(),
        });
        company = await ctx.db.get(companyId);
      }

      const existing = await ctx.db
        .query("residencies")
        .withIndex("by_external_id", (q) =>
          q.eq("externalId", record.externalId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...record,
          companyId: company?._id,
          syncedAt,
        });
      } else {
        await ctx.db.insert("residencies", {
          ...record,
          companyId: company?._id,
          syncedAt,
        });
      }
    }
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const updateCompanyImage = mutation({
  args: {
    companyId: v.id("companies"),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.companyId, {
      imageId: args.imageId,
    });
  },
});

export const updateResidencyDescription = mutation({
  args: {
    residencyId: v.id("residencies"),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.residencyId, {
      description: args.description,
    });
  },
});

export const updateResidencyLocation = mutation({
  args: {
    residencyId: v.id("residencies"),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.residencyId, {
      location: args.location || undefined,
    });
  },
});

export const mergeCompanies = mutation({
  args: {
    targetId: v.id("companies"),
    sourceIds: v.array(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.targetId);
    if (!target) {
      throw new Error("Target company not found");
    }

    const allAliases = new Set<string>(target.aliases || []);

    for (const sourceId of args.sourceIds) {
      const source = await ctx.db.get(sourceId);
      if (!source) continue;

      // Add source slug to aliases
      allAliases.add(source.slug);

      // Add any existing aliases from source
      if (source.aliases) {
        for (const alias of source.aliases) {
          allAliases.add(alias);
        }
      }

      // Update all residencies pointing to source to point to target
      const residencies = await ctx.db
        .query("residencies")
        .withIndex("by_company", (q) => q.eq("companyId", sourceId))
        .collect();

      for (const residency of residencies) {
        await ctx.db.patch(residency._id, { companyId: args.targetId });
      }

      // Delete source company
      await ctx.db.delete(sourceId);
    }

    // Update target with all collected aliases
    await ctx.db.patch(args.targetId, {
      aliases: Array.from(allAliases),
    });
  },
});
