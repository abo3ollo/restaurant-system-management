import { query } from "./_generated/server";

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