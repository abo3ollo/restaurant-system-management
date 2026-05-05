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
        
        // Check if order is already paid
        if (order.status === "paid") {
            throw new Error("Order is already paid");
        }

        const paymentId = await ctx.db.insert("payments", {
            restaurantId,
            orderId: args.orderId,
            amount: order.total,
            method: args.method,
            status: "completed",
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.orderId, { status: "paid" });
        
        // Only update table status for dine-in orders
        if (order.orderType === "dine_in" && order.tableId) {
            await ctx.db.patch(order.tableId, { status: "available" });
        }

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
            if (!order) return {
                ...payment,
                orderType: "unknown",
                tableName: "Unknown",
                orderTypeLabel: "Unknown",
            };
            
            // Handle table based on order type
            let tableName = "Unknown";
            if (order.orderType === "dine_in" && order.tableId) {
                const table = await ctx.db.get(order.tableId);
                tableName = table?.name ?? "Unknown Table";
            } else if (order.orderType === "takeaway") {
                tableName = "Takeaway";
            } else if (order.orderType === "delivery") {
                tableName = "Delivery";
            }
            
            return {
                ...payment,
                orderType: order.orderType,
                orderTypeLabel: order.orderType === "dine_in" ? "Dine In" : 
                               order.orderType === "takeaway" ? "Takeaway" : "Delivery",
                tableName,
                orderTotal: order.total,
            };
        }));
    },
});