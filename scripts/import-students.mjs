import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "fs";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error("Missing ADMIN_PASSWORD environment variable");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Read and parse CSV
const csv = readFileSync("ise-students.csv", "utf-8");
const lines = csv.trim().split("\n");
const header = lines[0]; // Skip header row

const emails = lines.slice(1).map((line) => {
  const [name, email] = line.split(",");
  return { name: name.trim(), email: email.trim() };
});

console.log(`Importing ${emails.length} students...`);

try {
  const result = await client.mutation(api.allowedEmails.bulkImport, {
    adminPassword: ADMIN_PASSWORD,
    emails,
  });
  console.log(`Done! Added: ${result.added}, Skipped: ${result.skipped}`);
} catch (error) {
  console.error("Import failed:", error.message);
  process.exit(1);
}
