import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
    "mark-expired-subscriptions",
    { hourUTC: 0, minuteUTC: 0 },
    internal.subscriptions.markExpiredSubscriptions,
);

export default crons;