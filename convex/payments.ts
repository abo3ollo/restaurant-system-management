import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";

export const processPayment = mutation({
    args: {
        orderId: v.id("orders"),
        method: v.union(v.literal("cash"), v.literal("card")),
    },
    handler: async (ctx, args) => {
        const { restaurantId } = await getRestaurantContext(ctx);

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        const paymentId = await ctx.db.insert("payments", {
            restaurantId,
            orderId: args.orderId,
            amount: order.total,
            method: args.method,
            status: "completed",
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.orderId, { status: "paid" });
        await ctx.db.patch(order.tableId, { status: "available" });

        return paymentId;
    },
});

export const getPayments = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);

        const payments = await ctx.db
            .query("payments")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .order("desc")
            .collect();

        return await Promise.all(payments.map(async (payment) => {
            const order = await ctx.db.get(payment.orderId);
            const table = order ? await ctx.db.get(order.tableId) : null;
            return {
                ...payment,
                tableName: table?.name ?? "Unknown",
            };
        }));
    },
});