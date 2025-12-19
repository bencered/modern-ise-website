"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";

const SOFTR_ENDPOINTS = [
  {
    name: "R1",
    url: "https://sheryl9652.preview.softr.app/v1/datasource/airtable/1a4e99c5-7a8f-4323-b0d5-aaa96a38141c/ae026310-d476-499d-bb4d-a126de2c0378/7b879f15-4c21-464d-8b99-4620a0e320b0/fb5530e8-e944-4c77-81e6-b38bc987396b/data",
  },
  {
    name: "R1+R2",
    url: "https://sheryl9652.preview.softr.app/v1/datasource/airtable/1a4e99c5-7a8f-4323-b0d5-aaa96a38141c/ae026310-d476-499d-bb4d-a126de2c0378/8cfabc27-6292-40e3-bd4f-fed6b8fc3a2c/cd955d21-6984-43fb-a6dc-4d4b35127ec4/data",
  },
  {
    name: "R2",
    url: "https://sheryl9652.preview.softr.app/v1/datasource/airtable/1a4e99c5-7a8f-4323-b0d5-aaa96a38141c/ae026310-d476-499d-bb4d-a126de2c0378/99d9522a-421a-467e-a645-73a89ed71bf0/f57e3170-bf24-4bb6-92f9-814e08ab32c4/data",
  },
  {
    name: "R3",
    url: "https://sheryl9652.preview.softr.app/v1/datasource/airtable/1a4e99c5-7a8f-4323-b0d5-aaa96a38141c/ae026310-d476-499d-bb4d-a126de2c0378/cd82fbb7-b0da-42e5-afd6-0adf9faf6757/478384e9-5ad7-47a6-8411-a9474249fdc0/data",
  },
  {
    name: "R4",
    url: "https://sheryl9652.preview.softr.app/v1/datasource/airtable/1a4e99c5-7a8f-4323-b0d5-aaa96a38141c/ae026310-d476-499d-bb4d-a126de2c0378/9857663e-7306-4961-b035-3688fd4a4471/d3a4d32d-f920-44a3-89a2-0705b30a6890/data",
  },
];

interface SoftrRecord {
  id: string;
  fields: {
    Name?: string;
    "Residency Title"?: string;
    "Job Title"?: string;
    "Job Description"?: string;
    "Email Application Address"?: string;
    "Monthly Salary"?: string;
    "Accommodation Support"?: string;
  };
  createdTime: string;
}

interface SoftrResponse {
  records: SoftrRecord[];
  offset: string | null;
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
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `jwtToken=${jwtToken}`,
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          console.error(
            `Failed to fetch ${endpoint.name}: ${response.status}`
          );
          continue;
        }

        const data: SoftrResponse = await response.json();

        for (const record of data.records) {
          allRecords.push({
            externalId: record.id,
            name: record.fields.Name || "",
            residencyType: endpoint.name,
            residencyTitle: record.fields["Residency Title"] || "",
            jobTitle: record.fields["Job Title"] || "",
            description: record.fields["Job Description"],
            emailAddress: record.fields["Email Application Address"],
            monthlySalary: record.fields["Monthly Salary"],
            accommodationSupport: record.fields["Accommodation Support"],
            createdAt: record.createdTime,
          });
        }

        console.log(`Fetched ${data.records.length} records from ${endpoint.name}`);
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
    const result = await ctx.runAction(internal.sync.syncAllResidencies, {});
    return result;
  },
});
