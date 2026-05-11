// convex/lib/subscriptionHelpers.ts
import { DatabaseReader } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getActiveSubscription(
    db: DatabaseReader,
    restaurantId: Id<"restaurants">
) {
    return await db
        .query("subscriptions")
        .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
        .order("desc")
        .first();
}

export function isSubscriptionActive(sub: {
    status: string;
    expiresAt: number;
} | null): boolean {
    if (!sub) return false;
    return (
        (sub.status === "trialing" || sub.status === "active") &&
        sub.expiresAt > Date.now()
    );
}

export function getSubscriptionRemainingDays(sub: {
    expiresAt: number;
} | null): number {
    if (!sub) return 0;
    return Math.max(
        0,
        Math.ceil((sub.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
    );
}

export function getPlanExpirationDate(
    plan: "trial" | "monthly" | "yearly",
    from: number = Date.now()
): number {
    const DAY = 24 * 60 * 60 * 1000;
    if (plan === "trial")   return from + 7 * DAY;
    if (plan === "monthly") return from + 30 * DAY;   // ← 30 days not 7
    if (plan === "yearly")  return from + 365 * DAY;
    return from + 7 * DAY;
}

export function getPlanLabel(plan: string): string {
    if (plan === "trial")   return "Free Trial";
    if (plan === "monthly") return "Monthly Plan";
    if (plan === "yearly")  return "Yearly Plan";
    return "Unknown Plan";
}

export function getPlanDurationDays(plan: string): number {
    if (plan === "trial")   return 7;
    if (plan === "monthly") return 30;   // ← 30 days
    if (plan === "yearly")  return 365;
    return 7;
}

export async function requireActiveSubscription(
    db: DatabaseReader,
    restaurantId: Id<"restaurants">
) {
    const sub = await getActiveSubscription(db, restaurantId);
    if (!isSubscriptionActive(sub)) {
        throw new Error("Subscription expired. Please upgrade your plan.");
    }
    return sub;
}

export function isManualSubscription(
    sub: { source?: string } | null
): boolean {
    if (!sub) return false;
    return (
        sub.source === "manual" ||
        sub.source === "gift" ||
        sub.source === "promo"
    );
}

export function isPaidSubscription(
    sub: { source?: string } | null
): boolean {
    if (!sub) return false;
    return sub.source === "payment";
}

export function getSubscriptionStatusColor(status: string): string {
    if (status === "trialing")  return "bg-amber-100 text-amber-700";
    if (status === "active")    return "bg-green-100 text-green-700";
    if (status === "expired")   return "bg-red-100 text-red-600";
    if (status === "cancelled") return "bg-neutral-100 text-neutral-500";
    if (status === "past_due")  return "bg-orange-100 text-orange-600";
    return "bg-neutral-100 text-neutral-500";
}

export function getSubscriptionRenewalInfo(sub: {
    autoRenew: boolean;
    status: string;
    expiresAt: number;
    source?: string;
} | null): string {
    if (!sub) return "No active subscription";
    if (sub.source === "gift" || sub.source === "manual") {
        return `Granted by admin — expires ${new Date(sub.expiresAt).toLocaleDateString()}`;
    }
    if (!sub.autoRenew) return `Expires ${new Date(sub.expiresAt).toLocaleDateString()} (no auto-renew)`;
    if (sub.status !== "active") return "Auto-renew (inactive)";
    return `Auto-renews on ${new Date(sub.expiresAt).toLocaleDateString()}`;
}