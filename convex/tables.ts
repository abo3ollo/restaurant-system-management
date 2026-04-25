import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTables = query({
    handler: async (ctx) => {
        return await ctx.db.query("tables").collect();
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
        // Check duplicate name
        const existing = await ctx.db
            .query("tables")
            .filter(q => q.eq(q.field("name"), args.name))
            .first();
        if (existing) throw new Error("Table name already exists");

        return await ctx.db.insert("tables", {
            name: args.name,
            capacity: args.capacity,
            status: args.status,
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
        // Check if table has active orders
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