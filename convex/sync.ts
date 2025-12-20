"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { validateAdminPassword } from "./admin";

const BASE_URL = "https://sheryl9652.preview.softr.app/v1/datasource/airtable/1a4e99c5-7a8f-4323-b0d5-aaa96a38141c";

const SOFTR_ENDPOINTS = [
  {
    name: "R1",
    listPath: "ae026310-d476-499d-bb4d-a126de2c0378/7b879f15-4c21-464d-8b99-4620a0e320b0/fb5530e8-e944-4c77-81e6-b38bc987396b",
    detailPath: "f4b5acb6-4e8e-4269-a40c-943922599cd3/44084a5e-0448-43eb-9a0b-757cbc057879/f205b45b-a318-40ba-a45a-0b64a4f7ffd9",
  },
  {
    name: "R1+R2",
    listPath: "ae026310-d476-499d-bb4d-a126de2c0378/8cfabc27-6292-40e3-bd4f-fed6b8fc3a2c/cd955d21-6984-43fb-a6dc-4d4b35127ec4",
    detailPath: "b1e02f50-4c0f-4a75-bb73-4d9aa67fd408/63efcf6c-65aa-4f4e-b8e7-e31b1db6b8f1/e657e567-cba7-4fa5-ad35-59447aef019a",
  },
  {
    name: "R2",
    listPath: "ae026310-d476-499d-bb4d-a126de2c0378/99d9522a-421a-467e-a645-73a89ed71bf0/f57e3170-bf24-4bb6-92f9-814e08ab32c4",
    detailPath: "f7568ddc-484d-4fc4-9155-2c15f203efe2/32f8d904-be3e-44f9-aba9-e111477cdff2/e657e567-cba7-4fa5-ad35-59447aef019a",
  },
  {
    name: "R3",
    listPath: "ae026310-d476-499d-bb4d-a126de2c0378/cd82fbb7-b0da-42e5-afd6-0adf9faf6757/478384e9-5ad7-47a6-8411-a9474249fdc0",
    detailPath: "90af125c-fce1-4e8e-af4d-30d5055e1b73/0c0252a2-095b-44c5-a077-4a346f648ded/e657e567-cba7-4fa5-ad35-59447aef019a",
  },
  {
    name: "R4",
    listPath: "ae026310-d476-499d-bb4d-a126de2c0378/9857663e-7306-4961-b035-3688fd4a4471/d3a4d32d-f920-44a3-89a2-0705b30a6890",
    detailPath: "2a41c41b-14d6-41f7-bf29-68b340580fac/1bc1ac77-4595-49fd-b1a6-6f0f1e91cdc8/e657e567-cba7-4fa5-ad35-59447aef019a",
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
  args: {
    adminPassword: v.string(),
  },
  handler: async (ctx, args): Promise<{ synced: number }> => {
    validateAdminPassword(args.adminPassword);
    const result = await ctx.runAction(internal.sync.syncAllResidencies, {});
    return result;
  },
});
