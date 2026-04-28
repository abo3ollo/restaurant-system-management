import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";

export const getTables = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        return await ctx.db
            .query("tables")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();
    },
});

export const addTable = mutation({
    args: {
        name: v.string(),
        capacity: v.optional(v.number()),
        status: v.union(
            v.literal("available"),
            v.literal("occupied"),
            v.literal("reserved")
        ),
    },
    handler: async (ctx, args) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        return await ctx.db.insert("tables", {
            ...args,
            restaurantId,
        });
    },
});

export const updateTable = mutation({
    args: {
        id: v.id("tables"),
        name: v.string(),
        capacity: v.optional(v.number()),
        status: v.union(
            v.literal("available"),
            v.literal("occupied"),
            v.literal("reserved")
        ),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        return await ctx.db.patch(id, rest);
    },
});

export const deleteTable = mutation({
    args: { id: v.id("tables") },
    handler: async (ctx, args) => {
        const activeOrder = await ctx.db
            .query("orders")
            .filter(q =>
                q.and(
                    q.eq(q.field("tableId"), args.id),
                    q.neq(q.field("status"), "paid")
                )
            )
            .first();
        if (activeOrder) throw new Error("Cannot delete table with active orders");
        return await ctx.db.delete(args.id);
    },
});