import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";

export const getOrders = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);

        const orders = await ctx.db
            .query("orders")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .order("desc")
            .collect();

        // Get all unique user IDs to fetch cashier names
        const userIds = [...new Set(orders.map(o => o.userId))];
        const users = await Promise.all(
            userIds.map(async (id) => {
                const user = await ctx.db.get(id);
                return { id, name: user?.name ?? "Unknown Cashier" };
            })
        );
        const userMap = new Map(users.map(u => [u.id, u.name]));

        return await Promise.all(orders.map(async (order) => {
            const table = await ctx.db.get(order.tableId);
            
            // Get payment method from payments table
            const payment = await ctx.db
                .query("payments")
                .withIndex("by_order", q => q.eq("orderId", order._id))
                .first();
            
            const items = await ctx.db
                .query("orderItems")
                .withIndex("by_order", q => q.eq("orderId", order._id))
                .collect();

            const itemsWithDetails = await Promise.all(items.map(async (item) => {
                const menuItem = await ctx.db.get(item.itemId);
                return {
                    ...item,
                    menuItemName: menuItem?.name ?? "Unknown",
                    menuItemPrice: menuItem?.price ?? 0,
                    menuItemImage: menuItem?.image ?? "",
                };
            }));

            return {
                ...order,
                tableName: table?.name ?? "Unknown",
                cashierName: userMap.get(order.userId) ?? "Unknown Cashier",
                paymentMethod: payment?.method ?? "N/A",
                items: itemsWithDetails,
            };
        }));
    },
});

// cashiers see their own orders automatically
export const getMyOrders = query({
    handler: async (ctx) => {
        const { restaurantId, user } = await getRestaurantContext(ctx);

        const orders = await ctx.db
            .query("orders")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .order("desc")
            .collect();

        const myOrders = orders.filter(o => o.userId === user._id);

        return await Promise.all(myOrders.map(async (order) => {
            const table = await ctx.db.get(order.tableId);
            const items = await ctx.db
                .query("orderItems")
                .withIndex("by_order", q => q.eq("orderId", order._id))
                .collect();

            const itemsWithDetails = await Promise.all(items.map(async (item) => {
                const menuItem = await ctx.db.get(item.itemId);
                return {
                    ...item,
                    menuItemName: menuItem?.name ?? "Unknown",
                    menuItemPrice: menuItem?.price ?? 0,
                };
            }));

            return {
                ...order,
                tableName: table?.name ?? "Unknown",
                items: itemsWithDetails,
            };
        }));
    },
});

export const createOrder = mutation({
    args: {
        tableId: v.id("tables"),
        userId: v.id("users"),
        items: v.array(v.object({
            itemId: v.id("menuItems"),
            quantity: v.number(),
            note: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const { restaurantId } = await getRestaurantContext(ctx);

        let total = 0;
        for (const item of args.items) {
            const menuItem = await ctx.db.get(item.itemId);
            if (!menuItem) continue;
            total += menuItem.price * item.quantity;
        }

        const orderId = await ctx.db.insert("orders", {
            restaurantId,
            tableId: args.tableId,
            userId: args.userId,
            status: "pending",
            total,
            createdAt: Date.now(),
        });

        for (const item of args.items) {
            await ctx.db.insert("orderItems", {
                restaurantId,
                orderId,
                itemId: item.itemId,
                quantity: item.quantity,
                note: item.note,
            });
        }

        await ctx.db.patch(args.tableId, { status: "occupied" });

        return orderId;
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
        if (args.status === "paid") {
            const order = await ctx.db.get(args.orderId);
            if (order) await ctx.db.patch(order.tableId, { status: "available" });
        }
    },
});

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
        const { restaurantId } = await getRestaurantContext(ctx);

        const existingItems = await ctx.db
            .query("orderItems")
            .withIndex("by_order", q => q.eq("orderId", args.orderId))
            .collect();

        await Promise.all(existingItems.map(item => ctx.db.delete(item._id)));

        let total = 0;
        for (const item of args.items) {
            const menuItem = await ctx.db.get(item.itemId);
            if (!menuItem) continue;
            total += menuItem.price * item.quantity;
        }

        await Promise.all(args.items.map(item =>
            ctx.db.insert("orderItems", {
                restaurantId,
                orderId: args.orderId,
                itemId: item.itemId,
                quantity: item.quantity,
                note: item.note,
            })
        ));

        await ctx.db.patch(args.orderId, { total });
        return args.orderId;
    },
});

// convex/orders.ts - Replace your getDashboardStats with this
export const getDashboardStats = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        
        const now = Date.now();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayStart = startOfToday.getTime();
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

        // Get orders for this restaurant only
        const allOrders = await ctx.db
            .query("orders")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();

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
                        .withIndex("by_order", q => q.eq("orderId", order._id))
                        .collect();
                    return {
                        ...order,
                        tableName: table?.name ?? "Unknown",
                        itemCount: items.length,
                    };
                })
        );

        // Top items by revenue (filter by restaurant)
        const allOrderItems = await ctx.db
            .query("orderItems")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();
            
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


export const getReportsData = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        
        // Filter by restaurant for all queries
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();
            
        const orderItems = await ctx.db
            .query("orderItems")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();
            
        const payments = await ctx.db
            .query("payments")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .collect();

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
        
        // Create a map of menu items to avoid repeated db calls
        const menuItemCache = new Map();
        for (const oi of orderItems) {
            if (!menuItemCache.has(oi.itemId)) {
                const menuItem = await ctx.db.get(oi.itemId);
                if (menuItem) menuItemCache.set(oi.itemId, menuItem);
            }
        }
        
        orderItems.forEach((oi) => {
            const menuItem = menuItemCache.get(oi.itemId);
            if (!menuItem) return;
            if (!itemStats[oi.itemId]) {
                itemStats[oi.itemId] = { name: menuItem.name, quantity: 0, revenue: 0 };
            }
            itemStats[oi.itemId].quantity += oi.quantity;
            itemStats[oi.itemId].revenue += menuItem.price * oi.quantity;
        });

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

        // ── Payment method breakdown ──
        const paymentMethods: Record<string, number> = {};
        payments.forEach(p => {
            const method = p.method;
            paymentMethods[method] = (paymentMethods[method] || 0) + p.amount;
        });

        // ── Summary stats ──
        const totalRevenue = orders
            .filter(o => o.status === "paid")
            .reduce((sum, o) => sum + o.total, 0);

        const totalOrders = orders.length;
        const paidOrders = orders.filter(o => o.status === "paid").length;
        const avgOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

        // ── Status breakdown ──
        const statusBreakdown: Record<string, number> = {};
        orders.forEach(o => {
            statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
        });

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
            paymentMethodBreakdown: Object.entries(paymentMethods).map(([method, amount]) => ({
                method,
                amount,
            })),
            statusBreakdown,
            totalRevenue,
            totalOrders,
            paidOrders,
            avgOrderValue,
        };
    },
});


//Takes a userId parameter - can be used by admins to view any cashier's orders
export const getCashierOrders = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        
        // Verify the user belongs to this restaurant
        const user = await ctx.db.get(args.userId);
        if (!user || user.restaurantId !== restaurantId) {
            throw new Error("Unauthorized: User not found in this restaurant");
        }
        
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .order("desc")
            .collect();

        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const table = await ctx.db.get(order.tableId);

                const items = await ctx.db
                    .query("orderItems")
                    .withIndex("by_order", q => q.eq("orderId", order._id))
                    .collect();

                const itemsWithDetails = await Promise.all(
                    items.map(async (item) => {
                        const menuItem = await ctx.db.get(item.itemId);
                        return {
                            ...item,
                            menuItemName: menuItem?.name ?? "Unknown",
                            menuItemPrice: menuItem?.price ?? 0,
                            menuItemImage: menuItem?.image ?? "",
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

