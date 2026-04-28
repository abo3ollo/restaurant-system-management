import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";



export const startShift = mutation({
    args: {
        openingBalance: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { user, restaurantId } = await getRestaurantContext(ctx); // ← use context

        // Check existing open shift
        const existing = await ctx.db
            .query("shifts")
            .withIndex("by_cashier", q => q.eq("cashierId", user._id))
            .filter(q => q.eq(q.field("status"), "open"))
            .first();

        if (existing) throw new Error("You already have an open shift");

        return await ctx.db.insert("shifts", {
            cashierId: user._id,
            restaurantId,          // ← add this
            startTime: Date.now(),
            openingBalance: args.openingBalance,
            status: "open",
            notes: args.notes,
        });
    },
});

// convex/shifts.ts
export const closeShift = mutation({
    args: {
        closingBalance: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { user, restaurantId } = await getRestaurantContext(ctx);

        // Get current open shift
        const shift = await ctx.db
            .query("shifts")
            .withIndex("by_cashier", q => q.eq("cashierId", user._id))
            .filter(q => q.eq(q.field("status"), "open"))
            .first();

        if (!shift) throw new Error("No open shift found");

        // Get all orders during this shift
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .filter(q => q.gte(q.field("createdAt"), shift.startTime))
            .collect();

        // Calculate revenue from paid orders
        const paidOrders = orders.filter(o => o.status === "paid");
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

        // Get all payments during this shift
        const payments = await ctx.db
            .query("payments")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();

        const shiftPayments = payments.filter(p => p.createdAt >= shift.startTime);
        
        // Calculate cash vs card sales
        const cashSalesTotal = shiftPayments
            .filter(p => p.method === "cash")
            .reduce((sum, p) => sum + p.amount, 0);
        
        const cardSalesTotal = shiftPayments
            .filter(p => p.method === "card")
            .reduce((sum, p) => sum + p.amount, 0);

        // Calculate expected balance and difference
        const expectedBalance = shift.openingBalance + cashSalesTotal;
        const difference = args.closingBalance - expectedBalance;

        // Get top selling item
        const orderItems = await ctx.db
            .query("orderItems")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();

        // Filter order items to only those from this shift
        const shiftOrderItems = [];
        for (const oi of orderItems) {
            const order = await ctx.db.get(oi.orderId);
            if (order && order.createdAt >= shift.startTime) {
                shiftOrderItems.push(oi);
            }
        }

        // Calculate item statistics
        const itemStats: Record<string, { name: string; quantity: number }> = {};
        for (const oi of shiftOrderItems) {
            const menuItem = await ctx.db.get(oi.itemId);
            if (menuItem) {
                if (!itemStats[oi.itemId]) {
                    itemStats[oi.itemId] = { name: menuItem.name, quantity: 0 };
                }
                itemStats[oi.itemId].quantity += oi.quantity;
            }
        }

        const topSellingItem = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity)[0];

        // Update shift with closing data
        await ctx.db.patch(shift._id, {
            endTime: Date.now(),
            closingBalance: args.closingBalance,
            expectedBalance,
            difference,
            cashSalesTotal,
            cardSalesTotal,
            totalRevenue,
            totalOrders: orders.length,
            paidOrders: paidOrders.length,
            topItem: topSellingItem?.name || "N/A",
            status: "closed", // Make sure to change status to closed
            notes: args.notes,
        });

        // Return the summary for the receipt
        return {
            cashierName: user.name,
            startTime: shift.startTime,
            endTime: Date.now(),
            openingBalance: shift.openingBalance,
            closingBalance: args.closingBalance,
            expectedBalance,
            difference,
            cashSalesTotal,
            cardSalesTotal,
            totalOrders: orders.length,
            paidOrders: paidOrders.length,
            totalRevenue,
            topItem: topSellingItem?.name || "N/A",
        };
    },
});

export const getCurrentShift = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return null;

        const shift = await ctx.db
            .query("shifts")
            .withIndex("by_cashier", q => q.eq("cashierId", user._id))
            .filter(q => q.eq(q.field("status"), "open"))
            .first();

        return shift ? { ...shift, cashierName: user.name } : null;
    },
});

export const getAllShifts = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx); // ← scoped

        const shifts = await ctx.db
            .query("shifts")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .order("desc")
            .collect();

        return await Promise.all(
            shifts.map(async (shift) => {
                const cashier = await ctx.db.get(shift.cashierId);
                return { ...shift, cashierName: cashier?.name ?? "Unknown" };
            })
        );
    },
});

export const getMyShiftHistory = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        return await ctx.db
            .query("shifts")
            .withIndex("by_cashier", q => q.eq("cashierId", user._id))
            .order("desc")
            .collect();
    },
});