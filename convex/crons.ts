import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "sync residencies",
  { hourUTC: 21, minuteUTC: 0 }, // 9pm UTC
  internal.sync.syncAllResidencies
);

export default crons;
