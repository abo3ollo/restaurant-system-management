import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Get current open shift ─────────────────────────────
export const getCurrentShift = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const shift = await ctx.db
      .query("shifts")
      .withIndex("by_cashier", (q) => q.eq("cashierId", user._id))
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();

    return shift ? { ...shift, cashierName: user.name } : null;
  },
});

// ── Start shift ────────────────────────────────────────
export const startShift = mutation({
  args: {
    openingBalance: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // Check existing open shift
    const existing = await ctx.db
      .query("shifts")
      .withIndex("by_cashier", (q) => q.eq("cashierId", user._id))
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();

    if (existing) throw new Error("You already have an open shift");

    return await ctx.db.insert("shifts", {
      cashierId: user._id,
      startTime: Date.now(),
      openingBalance: args.openingBalance,
      status: "open",
      notes: args.notes,
    });
  },
});

// ── Close shift ────────────────────────────────────────
export const closeShift = mutation({
  args: {
    closingBalance: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const shift = await ctx.db
      .query("shifts")
      .withIndex("by_cashier", (q) => q.eq("cashierId", user._id))
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();

    if (!shift) throw new Error("No open shift found");

    const closedAt = Date.now();

    // Get all orders during this shift
    const allOrders = await ctx.db.query("orders").collect();
    const shiftOrders = allOrders.filter(
      (o) =>
        o.userId === user._id &&
        o.createdAt >= shift.startTime &&
        o.createdAt <= closedAt,
    );

    // Get cash payments only
    const allPayments = await ctx.db.query("payments").collect();
    const cashOrderIds = new Set(
      allPayments.filter((p) => p.method === "cash").map((p) => p.orderId),
    );

    const cashSalesTotal = shiftOrders
      .filter((o) => o.status === "paid" && cashOrderIds.has(o._id))
      .reduce((sum, o) => sum + o.total, 0);

    const totalRevenue = shiftOrders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + o.total, 0);

    const expectedBalance = shift.openingBalance + cashSalesTotal;
    const difference = args.closingBalance - expectedBalance;

    // Get top item
    const allOrderItems = await ctx.db.query("orderItems").collect();
    const shiftOrderIds = new Set(shiftOrders.map((o) => o._id));
    const shiftItems = allOrderItems.filter((oi) =>
      shiftOrderIds.has(oi.orderId),
    );

    const itemCounts: Record<string, { name: string; count: number }> = {};
    await Promise.all(
      shiftItems.map(async (oi) => {
        const menuItem = await ctx.db.get(oi.itemId);
        if (!menuItem) return;
        if (!itemCounts[oi.itemId]) {
          itemCounts[oi.itemId] = { name: menuItem.name, count: 0 };
        }
        itemCounts[oi.itemId].count += oi.quantity;
      }),
    );

    const topItem = Object.values(itemCounts).sort(
      (a, b) => b.count - a.count,
    )[0];

    await ctx.db.patch(shift._id, {
      endTime: closedAt,
      closingBalance: args.closingBalance,
      expectedBalance,
      difference,
      cashSalesTotal,
      totalOrders: shiftOrders.length,
      totalRevenue,
      status: "closed",
      notes: args.notes || shift.notes,
    });

    return {
      cashierName: user.name,
      startTime: shift.startTime,
      endTime: closedAt,
      openingBalance: shift.openingBalance,
      closingBalance: args.closingBalance,
      expectedBalance,
      difference,
      cashSalesTotal,
      totalOrders: shiftOrders.length,
      paidOrders: shiftOrders.filter((o) => o.status === "paid").length,
      totalRevenue,
      topItem: topItem?.name ?? "N/A",
    };
  },
});

// ── My shift history ───────────────────────────────────
export const getMyShiftHistory = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("shifts")
      .withIndex("by_cashier", (q) => q.eq("cashierId", user._id))
      .order("desc")
      .collect();
  },
});

// ── All shifts (admin) ─────────────────────────────────
export const getAllShifts = query({
  handler: async (ctx) => {
    const shifts = await ctx.db.query("shifts").order("desc").collect();

    return await Promise.all(
      shifts.map(async (shift) => {
        const cashier = await ctx.db.get(shift.cashierId);
        return { ...shift, cashierName: cashier?.name ?? "Unknown" };
      }),
    );
  },
});
