import { QueryCtx, MutationCtx } from "./_generated/server";
import { getActiveSubscription, isSubscriptionActive } from "./lib/subscriptionHelpers";

export async function getRestaurantContext(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
        .first();

    if (!user) throw new Error("User not found");
    if (user.role === "super_admin") {
        return { user, restaurantId: null as any, restaurant: null as any };
    }
    if (!user.restaurantId) throw new Error("No restaurant assigned");

    const restaurant = await ctx.db.get(user.restaurantId);
    if (!restaurant) throw new Error("Restaurant not found");

    return { user, restaurantId: user.restaurantId, restaurant };
}

// ← New: context that also checks subscription
export async function getRestaurantContextWithSubscription(
    ctx: QueryCtx | MutationCtx
) {
    const base = await getRestaurantContext(ctx);

    const sub = await getActiveSubscription(ctx.db, base.restaurantId);
    if (!isSubscriptionActive(sub)) {
        throw new Error("Subscription expired. Please upgrade your plan.");
    }

    return { ...base, subscription: sub };
}