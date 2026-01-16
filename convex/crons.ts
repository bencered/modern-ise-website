import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour from 8am to 7pm UTC (12 times per day)
// Adjust the hours if you need a different timezone
crons.cron(
  "sync residencies",
  "0 8-19 * * *",
  internal.sync.syncAllResidencies
);

export default crons;
