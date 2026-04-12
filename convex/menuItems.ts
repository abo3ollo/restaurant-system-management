import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("menuItems").collect();
    },
});

export const getMenu = query({
    handler: async (ctx) => {
        const allItems = await ctx.db.query("menuItems").collect();
        const items = allItems.filter(item => !item.isDeleted);
        const categories = await ctx.db.query("categories").collect();

        return {
            items,
            categories,
        };
    },
});

// convex/menuItems.ts
export const addMenuItem = mutation({
    args: {
        name: v.string(),
        price: v.number(),
        categoryId: v.id("categories"),
        image: v.string(),
        description: v.string(),
        available: v.boolean(),
    },
    handler: async (ctx, args) => {
        // Fetch the category name
        const category = await ctx.db.get(args.categoryId);

        return await ctx.db.insert("menuItems", {
            ...args,
            category: category?.name || "",
        });
    },
});

export const updateMenuItem = mutation({
    args: {
        id: v.id("menuItems"),
        name: v.string(),
        price: v.number(),
        description: v.string(),
        image: v.string(),
        categoryId: v.id("categories"),
        available: v.boolean(),
    },

    handler: async (ctx, args) => {
        // Fetch the category name
        const category = await ctx.db.get(args.categoryId);
        
        await ctx.db.patch(args.id, {
            name: args.name,
            price: args.price,
            available: args.available,
            description: args.description,
            image: args.image,
            categoryId: args.categoryId,
            category: category?.name || "",
        });
    },
});


export const deleteMenuItem = mutation({
    args: {
        id: v.id("menuItems"),
    },

    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            isDeleted: true,
        });
    },
});
