import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const residencies = await ctx.db.query("residencies").collect();

    // Fetch company data for each residency
    const residenciesWithCompanies = await Promise.all(
      residencies.map(async (residency) => {
        let company = null;
        let imageUrl = null;
        if (residency.companyId) {
          const companyData = await ctx.db.get(residency.companyId);
          if (companyData) {
            // Get image URL from storage if imageId exists
            if (companyData.imageId) {
              imageUrl = await ctx.storage.getUrl(companyData.imageId);
            }
            company = { ...companyData, imageUrl };
          }
        }
        return { ...residency, company };
      })
    );

    return residenciesWithCompanies;
  },
});

export const getById = query({
  args: { id: v.id("residencies") },
  handler: async (ctx, args) => {
    const residency = await ctx.db.get(args.id);
    if (!residency) return null;

    let company = null;
    if (residency.companyId) {
      const companyData = await ctx.db.get(residency.companyId);
      if (companyData) {
        let imageUrl = null;
        if (companyData.imageId) {
          imageUrl = await ctx.storage.getUrl(companyData.imageId);
        }
        company = { ...companyData, imageUrl };
      }
    }

    return { ...residency, company };
  },
});

export const listCompanies = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    return Promise.all(
      companies.map(async (company) => ({
        ...company,
        imageUrl: company.imageId
          ? await ctx.storage.getUrl(company.imageId)
          : null,
      }))
    );
  },
});
