import { QueryCtx, MutationCtx } from "./_generated/server";

export async function getRestaurantContext(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
        .unique();

    if (!user) throw new Error("User not found");
    if (!user.restaurantId) throw new Error("No restaurant assigned");

    const restaurant = await ctx.db.get(user.restaurantId);
    if (!restaurant) throw new Error("Restaurant not found");
    if (restaurant.status === "suspended") throw new Error("Restaurant is suspended");

    return {
        user,
        restaurantId: user.restaurantId,
        restaurant,
    };
}

