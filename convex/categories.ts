import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";

export const getCategories = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        return await ctx.db
            .query("categories")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();
    },
});

export const addCategory = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        return await ctx.db.insert("categories", {
            name: args.name,
            restaurantId,
        });
    },
});

export const updateCategory = mutation({
    args: { id: v.id("categories"), name: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.id, { name: args.name });
    },
});

export const deleteCategory = mutation({
    args: { id: v.id("categories") },
    handler: async (ctx, args) => {
        const hasItems = await ctx.db
            .query("menuItems")
            .filter(q => q.eq(q.field("categoryId"), args.id))
            .first();
        if (hasItems) throw new Error("Cannot delete category with menu items");
        return await ctx.db.delete(args.id);
    },
});