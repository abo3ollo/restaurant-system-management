import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCategories = query({
    handler: async (ctx) => {
        return await ctx.db.query("categories").collect();
    },
});

export const addCategory = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("categories")
            .filter(q => q.eq(q.field("name"), args.name))
            .first();
        if (existing) throw new Error("Category already exists");

        return await ctx.db.insert("categories", { name: args.name });
    },
});

export const updateCategory = mutation({
    args: {
        id: v.id("categories"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.id, { name: args.name });
    },
});

export const deleteCategory = mutation({
    args: { id: v.id("categories") },
    handler: async (ctx, args) => {
        // Check if category has menu items
        const hasItems = await ctx.db
            .query("menuItems")
            .filter(q => q.eq(q.field("categoryId"), args.id))
            .first();

        if (hasItems) throw new Error("Cannot delete category with menu items");

        return await ctx.db.delete(args.id);
    },
});