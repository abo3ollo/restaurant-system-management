import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";

export const getMenu = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);

        const items = await ctx.db
            .query("menuItems")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();

        const categories = await ctx.db
            .query("categories")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();

        const categoryMap = new Map(categories.map(c => [c._id, c.name]));

        const itemsWithCategory = items.map(item => ({
            ...item,
            categoryName: item.categoryId
                ? categoryMap.get(item.categoryId) ?? "Unknown"
                : "Unknown",
        }));

        return { items: itemsWithCategory, categories };
    },
});

export const addMenuItem = mutation({
    args: {
        name: v.string(),
        price: v.number(),
        categoryId: v.id("categories"),
        image: v.optional(v.string()),
        description: v.optional(v.string()),
        available: v.boolean(),
    },
    handler: async (ctx, args) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        return await ctx.db.insert("menuItems", { ...args, restaurantId });
    },
});

export const editMenuItem = mutation({
    args: {
        id: v.id("menuItems"),
        name: v.string(),
        price: v.number(),
        categoryId: v.id("categories"),
        image: v.optional(v.string()),
        description: v.optional(v.string()),
        available: v.boolean(),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        return await ctx.db.patch(id, rest);
    },
});

export const deleteMenuItem = mutation({
    args: { id: v.id("menuItems") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

export const toggleAvailability = mutation({
    args: { id: v.id("menuItems"), available: v.boolean() },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.id, { available: args.available });
    },
});