import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync residencies",
  { hours: 16 },
  internal.sync.syncAllResidencies
);

export default crons;
