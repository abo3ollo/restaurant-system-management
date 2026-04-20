import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const processPayment = mutation({
    args: {
        orderId: v.id("orders"),
        method: v.union(v.literal("cash"), v.literal("card")),
    },
    handler: async (ctx, args) => {
        // Get the order
        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        // Create payment record
        const paymentId = await ctx.db.insert("payments", {
            orderId: args.orderId,
            tableId: order.tableId,
            amount: order.total,
            method: args.method,
            status: "completed",
            createdAt: Date.now(),
        });

        // Update order status → paid
        await ctx.db.patch(args.orderId, { status: "paid" });

        // Free the table
        await ctx.db.patch(order.tableId, { status: "available" });

        return paymentId;
    },
});

export const getPayments = query({
    handler: async (ctx) => {
        const payments = await ctx.db
            .query("payments")
            .order("desc")
            .collect();

        return await Promise.all(
            payments.map(async (payment) => {
                const order = await ctx.db.get(payment.orderId);
                const table = await ctx.db.get(payment.tableId);
                return {
                    ...payment,
                    tableName: table?.name ?? "Unknown",
                    orderStatus: order?.status ?? "unknown",
                };
            })
        );
    },
});