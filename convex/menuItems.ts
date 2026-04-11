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
    const items = await ctx.db.query("menuItems").collect();
    const categories = await ctx.db.query("categories").collect();

    return {
      items,
      categories,
    };
  },
})

// convex/menuItems.ts
export const addMenuItem = mutation({
    args: {
        name: v.string(),
        price: v.number(),
        categoryId: v.id("categories"),  // ← rename to categoryId
        image:v.string(),
        description: v.string(),
        available: v.boolean(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("menuItems", args);
    },
});

