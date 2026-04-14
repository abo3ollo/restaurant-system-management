import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createOrder = mutation({
    args: {
        tableId: v.id("tables"),
        userId: v.id("users"),
        items: v.array(
            v.object({
                itemId: v.id("menuItems"),
                quantity: v.number(),
                note: v.optional(v.string()),
            }),
        ),
    },

    handler: async (ctx, args) => {
        // 🧮 احسب total
        let total = 0;

        for (const item of args.items) {
            const menuItem = await ctx.db.get(item.itemId);
            if (!menuItem) continue;

            total += menuItem.price * item.quantity;
        }

        // 🧾 create order
        const orderId = await ctx.db.insert("orders", {
            tableId: args.tableId,
            userId: args.userId,
            status: "pending",
            total,
            createdAt: Date.now(),
        });

        // 🧩 create order items
        for (const item of args.items) {
            await ctx.db.insert("orderItems", {
                orderId,
                itemId: item.itemId,
                quantity: item.quantity,
                notes: item.note,
            });
        }

        // 🪑 update table
        await ctx.db.patch(args.tableId, {
            status: "occupied",
        });

        return orderId;
    },
});
