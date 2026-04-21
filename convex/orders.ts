import { mutation, query } from "./_generated/server";
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
export const getOrders = query({
    handler: async (ctx) => {
        const orders = await ctx.db.query("orders")
            .order("desc")
            .collect();

        // Join table name and order items
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const table = await ctx.db.get(order.tableId);
                const items = await ctx.db
                    .query("orderItems")
                    .filter((q) => q.eq(q.field("orderId"), order._id))
                    .collect();

                const itemsWithDetails = await Promise.all(
                    items.map(async (item) => {
                        const menuItem = await ctx.db.get(item.itemId);
                        return {
                            ...item,
                            menuItemName: menuItem?.name ?? "Unknown",
                            menuItemPrice: menuItem?.price ?? 0,
                        };
                    })
                );

                return {
                    ...order,
                    tableName: table?.name ?? "Unknown",
                    items: itemsWithDetails,
                };
            })
        );

        return ordersWithDetails;
    },
});

export const updateOrderStatus = mutation({
    args: {
        orderId: v.id("orders"),
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("preparing"),
            v.literal("served"),
            v.literal("paid"),
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.orderId, { status: args.status });

        // If paid → free the table
        if (args.status === "paid") {
            const order = await ctx.db.get(args.orderId);
            if (order) {
                await ctx.db.patch(order.tableId, { status: "available" });
            }
        }
    },
});




export const getCashierOrders = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const orders = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("userId"), args.userId)) // 🔥 أهم سطر
            .order("desc")
            .collect();

        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const table = await ctx.db.get(order.tableId);

                const items = await ctx.db
                    .query("orderItems")
                    .filter((q) => q.eq(q.field("orderId"), order._id))
                    .collect();

                const itemsWithDetails = await Promise.all(
                    items.map(async (item) => {
                        const menuItem = await ctx.db.get(item.itemId);
                        return {
                            ...item,
                            menuItemName: menuItem?.name ?? "Unknown",
                            menuItemPrice: menuItem?.price ?? 0,
                        };
                    })
                );

                return {
                    ...order,
                    tableName: table?.name ?? "Unknown",
                    items: itemsWithDetails,
                };
            })
        );

        return ordersWithDetails;
    },
});

export const getMyOrders = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Get current user from DB
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        // Get only this user's orders
        const orders = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("userId"), currentUser._id))
            .order("desc")
            .collect();

        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const table = await ctx.db.get(order.tableId);
                const items = await ctx.db
                    .query("orderItems")
                    .filter((q) => q.eq(q.field("orderId"), order._id))
                    .collect();

                const itemsWithDetails = await Promise.all(
                    items.map(async (item) => {
                        const menuItem = await ctx.db.get(item.itemId);
                        return {
                            ...item,
                            menuItemName: menuItem?.name ?? "Unknown",
                            menuItemPrice: menuItem?.price ?? 0,
                        };
                    })
                );

                return {
                    ...order,
                    tableName: table?.name ?? "Unknown",
                    items: itemsWithDetails,
                };
            })
        );

        return ordersWithDetails;
    },
});

// edit order items & quantity before confirming the order (only if it's still pending)
export const updateOrder = mutation({
    args: {
        orderId: v.id("orders"),
        items: v.array(v.object({
            itemId: v.id("menuItems"),
            quantity: v.number(),
            note: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        // Delete existing order items
        const existingItems = await ctx.db
            .query("orderItems")
            .filter((q) => q.eq(q.field("orderId"), args.orderId))
            .collect();

        await Promise.all(existingItems.map(item => ctx.db.delete(item._id)));

        // Recalculate total
        let total = 0;
        for (const item of args.items) {
            const menuItem = await ctx.db.get(item.itemId);
            if (!menuItem) continue;
            total += menuItem.price * item.quantity;
        }

        // Insert new items
        await Promise.all(
            args.items.map(item =>
                ctx.db.insert("orderItems", {
                    orderId: args.orderId,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    notes: item.note,
                })
            )
        );

        // Update total
        await ctx.db.patch(args.orderId, { total });

        return args.orderId;
    },
});


// Dashboard stats
export const getDashboardStats = query({
    handler: async (ctx) => {
        const now = Date.now();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayStart = startOfToday.getTime();
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

        // All orders
        const allOrders = await ctx.db.query("orders").collect();

        // Today's orders
        const todayOrders = allOrders.filter(o => o.createdAt >= todayStart);
        const yesterdayOrders = allOrders.filter(
            o => o.createdAt >= yesterdayStart && o.createdAt < todayStart
        );

        // Today's revenue (paid orders only)
        const todayRevenue = todayOrders
            .filter(o => o.status === "paid")
            .reduce((sum, o) => sum + o.total, 0);

        const yesterdayRevenue = yesterdayOrders
            .filter(o => o.status === "paid")
            .reduce((sum, o) => sum + o.total, 0);

        // Total orders today
        const todayOrderCount = todayOrders.length;
        const yesterdayOrderCount = yesterdayOrders.length;

        // Avg order value today
        const avgOrderValue = todayOrderCount > 0
            ? todayRevenue / todayOrderCount
            : 0;
        const yesterdayAvg = yesterdayOrderCount > 0
            ? yesterdayRevenue / yesterdayOrderCount
            : 0;

        // Recent orders with details
        const recentOrders = await Promise.all(
            allOrders
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5)
                .map(async (order) => {
                    const table = await ctx.db.get(order.tableId);
                    const items = await ctx.db
                        .query("orderItems")
                        .filter(q => q.eq(q.field("orderId"), order._id))
                        .collect();
                    return {
                        ...order,
                        tableName: table?.name ?? "Unknown",
                        itemCount: items.length,
                    };
                })
        );

        // Top items by revenue
        const allOrderItems = await ctx.db.query("orderItems").collect();
        const itemStats: Record<string, { name: string; orders: number; revenue: number }> = {};

        await Promise.all(
            allOrderItems.map(async (oi) => {
                const menuItem = await ctx.db.get(oi.itemId);
                if (!menuItem) return;
                if (!itemStats[oi.itemId]) {
                    itemStats[oi.itemId] = { name: menuItem.name, orders: 0, revenue: 0 };
                }
                itemStats[oi.itemId].orders += oi.quantity;
                itemStats[oi.itemId].revenue += menuItem.price * oi.quantity;
            })
        );

        const topItems = Object.values(itemStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 4);

        // % change helper
        const pctChange = (today: number, yesterday: number) => {
            if (yesterday === 0) return today > 0 ? 100 : 0;
            return +((((today - yesterday) / yesterday) * 100).toFixed(1));
        };

        return {
            todayRevenue,
            yesterdayRevenue,
            todayOrderCount,
            yesterdayOrderCount,
            avgOrderValue,
            yesterdayAvg,
            revenueChange: pctChange(todayRevenue, yesterdayRevenue),
            ordersChange: pctChange(todayOrderCount, yesterdayOrderCount),
            avgChange: pctChange(avgOrderValue, yesterdayAvg),
            recentOrders,
            topItems,
        };
    },
});

// Detailed reports for analytics page
export const getReportsData = query({
    handler: async (ctx) => {
        const orders = await ctx.db.query("orders").collect();
        const orderItems = await ctx.db.query("orderItems").collect();
        const payments = await ctx.db.query("payments").collect();

        // ── Daily revenue (last 7 days) ──
        const dailyRevenue: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            dailyRevenue[key] = 0;
        }

        orders
            .filter(o => o.status === "paid")
            .forEach(o => {
                const key = new Date(o.createdAt).toISOString().split("T")[0];
                if (key in dailyRevenue) dailyRevenue[key] += o.total;
            });

        // ── Weekly revenue (last 4 weeks) ──
        const weeklyRevenue: Record<string, number> = {};
        for (let i = 3; i >= 0; i--) {
            weeklyRevenue[`Week ${4 - i}`] = 0;
        }

        orders
            .filter(o => o.status === "paid")
            .forEach(o => {
                const weeksAgo = Math.floor((Date.now() - o.createdAt) / (7 * 24 * 60 * 60 * 1000));
                if (weeksAgo < 4) {
                    const key = `Week ${4 - weeksAgo}`;
                    weeklyRevenue[key] = (weeklyRevenue[key] ?? 0) + o.total;
                }
            });

        // ── Monthly revenue (last 6 months) ──
        const monthlyRevenue: Record<string, number> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = monthNames[d.getMonth()];
            monthlyRevenue[key] = 0;
        }

        orders
            .filter(o => o.status === "paid")
            .forEach(o => {
                const d = new Date(o.createdAt);
                const monthsAgo = (new Date().getFullYear() - d.getFullYear()) * 12 +
                    (new Date().getMonth() - d.getMonth());
                if (monthsAgo < 6) {
                    const key = monthNames[d.getMonth()];
                    monthlyRevenue[key] = (monthlyRevenue[key] ?? 0) + o.total;
                }
            });

        // ── Top selling items ──
        const itemStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
        await Promise.all(
            orderItems.map(async (oi) => {
                const menuItem = await ctx.db.get(oi.itemId);
                if (!menuItem) return;
                if (!itemStats[oi.itemId]) {
                    itemStats[oi.itemId] = { name: menuItem.name, quantity: 0, revenue: 0 };
                }
                itemStats[oi.itemId].quantity += oi.quantity;
                itemStats[oi.itemId].revenue += menuItem.price * oi.quantity;
            })
        );

        const topItems = Object.values(itemStats)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 8);

        // ── Busiest hours ──
        const hourlyOrders: Record<number, number> = {};
        for (let h = 0; h < 24; h++) hourlyOrders[h] = 0;
        orders.forEach(o => {
            const hour = new Date(o.createdAt).getHours();
            hourlyOrders[hour]++;
        });

        // ── Summary stats ──
        const totalRevenue = orders
            .filter(o => o.status === "paid")
            .reduce((sum, o) => sum + o.total, 0);

        const totalOrders = orders.length;
        const paidOrders = orders.filter(o => o.status === "paid").length;
        const avgOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

        return {
            dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({
                label: new Date(date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }),
                revenue,
            })),
            weeklyRevenue: Object.entries(weeklyRevenue).map(([label, revenue]) => ({ label, revenue })),
            monthlyRevenue: Object.entries(monthlyRevenue).map(([label, revenue]) => ({ label, revenue })),
            topItems,
            hourlyOrders: Object.entries(hourlyOrders).map(([hour, count]) => ({
                hour: parseInt(hour),
                label: `${parseInt(hour).toString().padStart(2, "0")}:00`,
                count,
            })),
            totalRevenue,
            totalOrders,
            paidOrders,
            avgOrderValue,
        };
    },
});