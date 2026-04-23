import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get current open shift for logged in user
export const getCurrentShift = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return null;

        return await ctx.db
            .query("shifts")
            .withIndex("by_cashier", q => q.eq("cashierId", user._id))
            .filter(q => q.eq(q.field("status"), "open"))
            .first();
    },
});

// Open a new shift
export const openShift = mutation({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Check if already has open shift
        const existing = await ctx.db
            .query("shifts")
            .withIndex("by_cashier", q => q.eq("cashierId", user._id))
            .filter(q => q.eq(q.field("status"), "open"))
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("shifts", {
            cashierId: user._id,
            startTime: Date.now(),
            status: "open",
        });
    },
});

// Close the current shift
export const closeShift = mutation({
    args: { shiftId: v.id("shifts") },
    handler: async (ctx, args) => {
        const shift = await ctx.db.get(args.shiftId);
        if (!shift) throw new Error("Shift not found");

        // Get all orders created during this shift
        const orders = await ctx.db.query("orders").collect();
        const shiftOrders = orders.filter(
            o => o.createdAt >= shift.startTime &&
                o.userId === shift.cashierId
        );

        const paidOrders = shiftOrders.filter(o => o.status === "paid");
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

        await ctx.db.patch(args.shiftId, {
            endTime: Date.now(),
            status: "closed",
            totalOrders: shiftOrders.length,
            totalRevenue,
        });

        // Build summary to return
        const orderItems = await ctx.db.query("orderItems").collect();
        const shiftOrderIds = new Set(shiftOrders.map(o => o._id));
        const shiftItems = orderItems.filter(oi => shiftOrderIds.has(oi.orderId));

        // Top item
        const itemCounts: Record<string, { name: string; count: number }> = {};
        await Promise.all(shiftItems.map(async (oi) => {
            const menuItem = await ctx.db.get(oi.itemId);
            if (!menuItem) return;
            if (!itemCounts[oi.itemId]) {
                itemCounts[oi.itemId] = { name: menuItem.name, count: 0 };
            }
            itemCounts[oi.itemId].count += oi.quantity;
        }));

        const topItem = Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)[0];

        return {
            totalOrders: shiftOrders.length,
            paidOrders: paidOrders.length,
            totalRevenue,
            topItem: topItem?.name ?? "N/A",
            startTime: shift.startTime,
            endTime: Date.now(),
        };
    },
});

// Get all shifts (for admin reports)
export const getAllShifts = query({
    handler: async (ctx) => {
        const shifts = await ctx.db.query("shifts").order("desc").collect();
        return await Promise.all(
            shifts.map(async (shift) => {
                const cashier = await ctx.db.get(shift.cashierId);
                return {
                    ...shift,
                    cashierName: cashier?.name ?? "Unknown",
                };
            })
        );
    },
});