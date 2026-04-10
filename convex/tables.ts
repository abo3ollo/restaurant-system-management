import { query } from "./_generated/server";

export const getTables = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("tables").collect();
    },
});