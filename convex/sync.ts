"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";

const BASE_URL = "https://sheryl9652.preview.softr.app/v1/datasource/airtable/1a4e99c5-7a8f-4323-b0d5-aaa96a38141c";

// R1, R1+R2, R2, and R3 were removed here — as of 2026-08-31 those views no
// longer exist in the Softr app (fetches 404 rather than reflecting a stale
// ID), only R4 and R5 remain. Re-add a tier here if it comes back.
const SOFTR_ENDPOINTS = [
  {
    name: "R4",
    listPath: "ae026310-d476-499d-bb4d-a126de2c0378/ddff028b-9e15-4a05-a8c5-362b31243411/d3a4d32d-f920-44a3-89a2-0705b30a6890",
    detailPath: "2a41c41b-14d6-41f7-bf29-68b340580fac/1bc1ac77-4595-49fd-b1a6-6f0f1e91cdc8/e657e567-cba7-4fa5-ad35-59447aef019a",
  },
  {
    name: "R5",
    listPath: "ae026310-d476-499d-bb4d-a126de2c0378/53ebe50d-4aaa-4c6a-879a-73eb8bb62f87/0390b74c-e03f-4dbe-b58b-784d2a6b0738",
    detailPath: "651c602a-3ced-4bc9-bcb2-e8f542ed9c76/b69b7981-9f9d-4cd5-850a-250da5311206/e657e567-cba7-4fa5-ad35-59447aef019a",
  },
];

interface SoftrListRecord {
  id: string;
  fields: {
    Name?: string;
    "Residency Title"?: string;
    "Job Title"?: string;
    "Email Application Address"?: string;
    "Monthly Salary"?: string;
    "Accomodation Support"?: string; // Note: misspelled in API
  };
  createdTime: string;
}

interface SoftrDetailRecord {
  id: string;
  fields: {
    Name?: string;
    "Residency Title"?: string;
    "Job Title"?: string;
    "Job Description"?: string;
    "Email Application Address"?: string;
    "Monthly Salary"?: string;
    "Accomodation Support"?: string;
  };
  createdTime: string;
}

interface SoftrListResponse {
  records: SoftrListRecord[];
  offset: string | null;
}

interface SoftrDetailResponse {
  totalCount: number;
  records: SoftrDetailRecord[];
}

export const syncAllResidencies = internalAction({
  args: {},
  handler: async (ctx) => {
    const jwtToken = process.env.SOFTR_JWT_TOKEN;
    if (!jwtToken) {
      throw new Error("SOFTR_JWT_TOKEN environment variable is not set");
    }

    const allRecords: Array<{
      externalId: string;
      name: string;
      residencyType: string;
      residencyTitle: string;
      jobTitle: string;
      description?: string;
      emailAddress?: string;
      monthlySalary?: string;
      accommodationSupport?: string;
      createdAt: string;
    }> = [];

    for (const endpoint of SOFTR_ENDPOINTS) {
      try {
        // First fetch the list of records
        const listUrl = `${BASE_URL}/${endpoint.listPath}/data`;
        const listResponse = await fetch(listUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `jwtToken=${jwtToken}`,
          },
          body: JSON.stringify({}),
        });

        if (!listResponse.ok) {
          console.error(
            `Failed to fetch ${endpoint.name} list: ${listResponse.status}`
          );
          continue;
        }

        const listData: SoftrListResponse = await listResponse.json();
        console.log(`Fetched ${listData.records.length} records from ${endpoint.name}`);

        // Fetch details for each record to get Job Description
        for (const record of listData.records) {
          let description: string | undefined;

          try {
            const detailUrl = `${BASE_URL}/${endpoint.detailPath}/data/${record.id}`;
            const detailResponse = await fetch(detailUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: `jwtToken=${jwtToken}`,
              },
              body: JSON.stringify({}),
            });

            if (detailResponse.ok) {
              const detailData: SoftrDetailResponse = await detailResponse.json();
              if (detailData.records.length > 0) {
                description = detailData.records[0].fields["Job Description"];
              }
            }
          } catch (detailError) {
            console.error(`Error fetching detail for ${record.id}:`, detailError);
          }

          allRecords.push({
            externalId: record.id,
            name: record.fields.Name || "",
            residencyType: endpoint.name,
            residencyTitle: record.fields["Residency Title"] || "",
            jobTitle: record.fields["Job Title"] || "",
            description,
            emailAddress: record.fields["Email Application Address"],
            monthlySalary: record.fields["Monthly Salary"],
            accommodationSupport: record.fields["Accomodation Support"], // Note: misspelled in API
            createdAt: record.createdTime,
          });
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint.name}:`, error);
      }
    }

    // Upsert all records
    await ctx.runMutation(internal.mutations.upsertResidencies, {
      records: allRecords,
    });

    console.log(`Synced ${allRecords.length} total residencies`);
    return { synced: allRecords.length };
  },
});

// Public action for manual sync from admin panel
export const triggerSync = action({
  args: {},
  handler: async (ctx): Promise<{ synced: number }> => {
    // Verify admin status via internal query
    await ctx.runQuery(internal.admin.checkAdminStatus, {});
    const result = await ctx.runAction(internal.sync.syncAllResidencies, {});
    return result;
  },
});
