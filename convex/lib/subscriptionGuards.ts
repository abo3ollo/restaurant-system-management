

import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { 
    getActiveSubscription, 
    isSubscriptionActive,
    getSubscriptionRemainingDays 
} from "./subscriptionHelpers";

/**
 * Guard for operations requiring an active subscription
 * Throws error if subscription is expired or missing
 */
export async function guardActiveSubscription(
    ctx: MutationCtx | QueryCtx,
    restaurantId: Id<"restaurants">
) {
    const sub = await getActiveSubscription(ctx.db, restaurantId);
    
    if (!isSubscriptionActive(sub)) {
        const statusMsg = sub?.status || "none";
        const isExpired = sub && sub.expiresAt && sub.expiresAt < Date.now();
        throw new Error(
            `Access denied: Subscription inactive. ` +
            `Status: ${statusMsg}, ` +
            `Expired: ${isExpired ? "yes" : "no"}`
        );
    }
    
    return sub;
}

/**
 * Guard for operations requiring specific plan
 */
export async function guardPlanFeature(
    ctx: MutationCtx | QueryCtx,
    restaurantId: Id<"restaurants">,
    requiredPlan: "weekly" | "yearly" | "trial"
) {
    const sub = await guardActiveSubscription(ctx, restaurantId);
    
    if (!sub) {
        throw new Error("Subscription not found after validation");
    }
    
    const planHierarchy = {
        trial: 0,
        weekly: 1,
        yearly: 2,
    };
    
    const required = planHierarchy[requiredPlan];
    const current = planHierarchy[sub.plan as keyof typeof planHierarchy] || 0;
    
    if (current < required) {
        const currentPlan = sub.plan || "unknown";
        throw new Error(
            `Plan feature not available. ` +
            `Current: ${currentPlan}, Required: ${requiredPlan}`
        );
    }
    
    return sub;
}

/**
 * Guard for critical operations (stripe keys, exports, etc.)
 */
export async function guardCriticalOperation(
    ctx: MutationCtx,
    restaurantId: Id<"restaurants">,
    operationName: string
) {
    const sub = await guardActiveSubscription(ctx, restaurantId);
    
    // Add logging for audit trail
    try {
        await ctx.db.insert("billingLogs", {
            restaurantId,
            type: "info" as const,
            message: `Critical operation: ${operationName}`,
            createdAt: Date.now(),
        });
    } catch (e) {
        // Logging failed, but operation should continue
        console.error("Failed to log critical operation:", e);
    }
    
    return sub;
}

/**
 * Check if restaurant can access the platform
 * Returns false instead of throwing (for read-only checks)
 */
export async function canAccessPlatform(
    ctx: MutationCtx | QueryCtx,
    restaurantId: Id<"restaurants">
): Promise<boolean> {
    const sub = await getActiveSubscription(ctx.db, restaurantId);
    return isSubscriptionActive(sub);
}

/**
 * Get subscription status without throwing
 */
export async function getSubscriptionStatus(
    ctx: MutationCtx | QueryCtx,
    restaurantId: Id<"restaurants">
) {
    const sub = await getActiveSubscription(ctx.db, restaurantId);
    
    return {
        isActive: isSubscriptionActive(sub),
        status: sub?.status || "none",
        daysLeft: getSubscriptionRemainingDays(sub),
        expiresAt: sub?.expiresAt || null,
        plan: sub?.plan || "none",
    };
}

/**
 * Validate restaurant status is not suspended
 */
export async function guardRestaurantNotSuspended(
    ctx: MutationCtx | QueryCtx,
    restaurantId: Id<"restaurants">
) {
    const restaurant = await ctx.db.get(restaurantId);
    
    if (!restaurant) {
        throw new Error("Restaurant not found");
    }
    
    if (restaurant.status === "suspended") {
        throw new Error("Restaurant is suspended. Contact support.");
    }
    
    return restaurant;
}

/**
 * Combined guard: subscription active AND restaurant not suspended
 */
export async function guardRestaurantAccess(
    ctx: MutationCtx | QueryCtx,
    restaurantId: Id<"restaurants">
) {
    const restaurant = await guardRestaurantNotSuspended(ctx, restaurantId);
    const subscription = await guardActiveSubscription(ctx, restaurantId);
    
    return { restaurant, subscription };
}
