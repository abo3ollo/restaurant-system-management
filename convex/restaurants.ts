import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("restaurants")
            .withIndex("by_slug", q => q.eq("slug", args.slug))
            .unique();
    },
});

export const getAll = query({
    handler: async (ctx) => {
        const restaurants = await ctx.db.query("restaurants").collect();
        return await Promise.all(
            restaurants.map(async (r) => {
                const users = await ctx.db
                    .query("users")
                    .withIndex("by_restaurant", q => q.eq("restaurantId", r._id))
                    .collect();

                const orders = await ctx.db
                    .query("orders")
                    .withIndex("by_restaurant", q => q.eq("restaurantId", r._id))
                    .collect();

                const revenue = orders
                    .filter(o => o.status === "paid")
                    .reduce((sum, o) => sum + o.total, 0);

                // Fetch current subscription to get plan info
                const subscription = await ctx.db
                    .query("subscriptions")
                    .withIndex("by_restaurant", q => q.eq("restaurantId", r._id))
                    .order("desc")
                    .first();

                return {
                    ...r,
                    currentPlan: subscription?.plan === "monthly" ? "monthly" : 
                                 subscription?.plan === "yearly" ? "yearly" :
                                 r.currentPlan || "free",
                    userCount: users.length,
                    orderCount: orders.length,
                    revenue,
                };
            })
        );
    },
});

export const getRestaurantById = query({
    args: { id: v.id("restaurants") },
    handler: async (ctx, args) => {
        const restaurant = await ctx.db.get(args.id);
        if (!restaurant) return null;

        const users = await ctx.db
            .query("users")
            .withIndex("by_restaurant", q => q.eq("restaurantId", args.id))
            .collect();

        const orders = await ctx.db
            .query("orders")
            .withIndex("by_restaurant", q => q.eq("restaurantId", args.id))
            .order("desc")
            .collect();

        const menuItems = await ctx.db
            .query("menuItems")
            .withIndex("by_restaurant", q => q.eq("restaurantId", args.id))
            .collect();

        const tables = await ctx.db
            .query("tables")
            .withIndex("by_restaurant", q => q.eq("restaurantId", args.id))
            .collect();

        const payments = await ctx.db
            .query("payments")
            .withIndex("by_restaurant", q => q.eq("restaurantId", args.id))
            .collect();

        // ── Subscription ───────────────────────────────
        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_restaurant", q => q.eq("restaurantId", args.id))
            .order("desc")
            .first();

        const now = Date.now();
        
        // Calculate expiration based on plan
        const getDaysForPlan = (plan: string): number => {
            if (plan === "monthly") return 30;
            if (plan === "yearly") return 365;
            return 7; // free plan
        };
        
        const subscriptionData = subscription ? {
            ...subscription,
            isExpired: subscription.expiresAt < now,
            daysLeft: Math.max(0, Math.ceil(
                (subscription.expiresAt - now) / (1000 * 60 * 60 * 24)
            )),
            planLabel:
                subscription.plan === "trial"   ? "Free Trial"    :
                subscription.plan === "monthly" ? "Monthly Plan"   :
                subscription.plan === "yearly"  ? "Yearly Plan"   : "Unknown",
        } : {
            plan: restaurant.currentPlan,
            status: restaurant.currentPlan === "free" ? "trialing" : "active",
            source: "manual",
            planLabel:
                restaurant.currentPlan === "free"   ? "Free Plan"   :
                restaurant.currentPlan === "monthly" ? "Monthly Plan"  :
                restaurant.currentPlan === "yearly" ? "Yearly Plan"  : "Unknown",
            isExpired: false,
            daysLeft: getDaysForPlan(restaurant.currentPlan || "free"),
            startsAt: now,
            expiresAt: now + getDaysForPlan(restaurant.currentPlan || "free") * 24 * 60 * 60 * 1000,
            autoRenew: restaurant.currentPlan !== "free",
            createdAt: restaurant.createdAt,
        };

        // ── Billing payments ───────────────────────────
        const billingPayments = await ctx.db
            .query("billingPayments")
            .withIndex("by_restaurant", q => q.eq("restaurantId", args.id))
            .order("desc")
            .collect();

        // ── Recent orders ──────────────────────────────
        const recentOrders = await Promise.all(
            orders.slice(0, 10).map(async (order) => {
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
                    ...order,
                    tableName,
                    orderTypeLabel:
                        order.orderType === "dine_in"  ? "Dine In"  :
                        order.orderType === "takeaway" ? "Takeaway" : "Delivery",
                };
            })
        );

        // ── Revenue ────────────────────────────────────
        const paidOrders = orders.filter(o => o.status === "paid");
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

        const revenueByOrderType = {
            dine_in:  paidOrders.filter(o => o.orderType === "dine_in").reduce((sum, o) => sum + o.total, 0),
            takeaway: paidOrders.filter(o => o.orderType === "takeaway").reduce((sum, o) => sum + o.total, 0),
            delivery: paidOrders.filter(o => o.orderType === "delivery").reduce((sum, o) => sum + o.total, 0),
        };

        const orderCountByType = {
            dine_in:  orders.filter(o => o.orderType === "dine_in").length,
            takeaway: orders.filter(o => o.orderType === "takeaway").length,
            delivery: orders.filter(o => o.orderType === "delivery").length,
        };

        const cashRevenue = payments.filter(p => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
        const cardRevenue = payments.filter(p => p.method === "card").reduce((sum, p) => sum + p.amount, 0);

        // ── Daily revenue last 7 days ──────────────────
        const dailyRevenue: Record<string, {
            total: number; dine_in: number; takeaway: number; delivery: number;
        }> = {};

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            dailyRevenue[key] = { total: 0, dine_in: 0, takeaway: 0, delivery: 0 };
        }

        paidOrders.forEach(order => {
            const key = new Date(order.createdAt).toISOString().split("T")[0];
            if (key in dailyRevenue) {
                dailyRevenue[key].total += order.total;
                if (order.orderType === "dine_in")       dailyRevenue[key].dine_in  += order.total;
                else if (order.orderType === "takeaway")  dailyRevenue[key].takeaway += order.total;
                else if (order.orderType === "delivery")  dailyRevenue[key].delivery += order.total;
            }
        });

        return {
            ...restaurant,
            users,
            recentOrders,
            menuItemCount: menuItems.length,
            tableCount: tables.length,
            totalOrders: orders.length,
            paidOrders: paidOrders.length,
            totalRevenue,
            cashRevenue,
            cardRevenue,
            revenueByOrderType,
            orderCountByType,
            dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
                label: new Date(date).toLocaleDateString("en", {
                    weekday: "short", month: "short", day: "numeric"
                }),
                revenue: data.total,
                dine_in:  data.dine_in,
                takeaway: data.takeaway,
                delivery: data.delivery,
            })),

            // ── Subscription fields ──────────────────
            subscription: subscriptionData,
            billingPayments,
            totalBillingRevenue: billingPayments
                .filter(p => p.status === "success")
                .reduce((sum, p) => sum + p.amount, 0),
        };
    },
});

export const createRestaurant = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        address: v.optional(v.string()),
        phone: v.optional(v.string()),
        clerkId: v.string(),
        ownerName: v.string(),
        ownerEmail: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("restaurants")
            .withIndex("by_slug", q => q.eq("slug", args.slug))
            .first();
        if (existing) throw new Error("Slug already taken");

        const restaurantId = await ctx.db.insert("restaurants", {
            name: args.name,
            slug: args.slug,
            address: args.address,
            phone: args.phone,
            currentPlan: "free",
            status: "active",
            createdAt: Date.now(),
        });

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, { restaurantId, role: "admin" });
        } else {
            await ctx.db.insert("users", {
                clerkId: args.clerkId,
                name: args.ownerName,
                email: args.ownerEmail,
                role: "admin",
                restaurantId,
            });
        }

        const now = Date.now();
        const trialEndsAt = now + 7 * 24 * 60 * 60 * 1000;

        // ← Add source + updatedAt (required by schema)
        await ctx.db.insert("subscriptions", {
            restaurantId,
            plan: "trial",
            status: "trialing",
            source: "trial",       // ← was missing
            startsAt: now,
            expiresAt: trialEndsAt,
            trialEndsAt,
            autoRenew: false,
            createdAt: now,
            updatedAt: now,        // ← was missing
        });

        await ctx.db.insert("billingLogs", {
            restaurantId,
            message: "Free trial started — 7 days unlimited access",
            type: "info",
            createdAt: now,
        });

        return restaurantId;
    },
});

export const updateRestaurant = mutation({
    args: {
        id: v.id("restaurants"),
        name: v.optional(v.string()),
        address: v.optional(v.string()),
        phone: v.optional(v.string()),
        logo: v.optional(v.string()),
        status: v.optional(v.union(v.literal("active"), v.literal("suspended"))),
        currentPlan: v.optional(v.union(v.literal("free"), v.literal("monthly"), v.literal("yearly"))),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        const updates = Object.fromEntries(
            Object.entries(rest).filter(([_, v]) => v !== undefined)
        );
        return await ctx.db.patch(id, updates);
    },
});

export const deleteRestaurant = mutation({
    args: { id: v.id("restaurants") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

export const getMyRestaurant = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.restaurantId) return null;

        return await ctx.db.get(user.restaurantId);
    },
});

export const updateSettings = mutation({
    args: {
        id: v.id("restaurants"),
        taxRate: v.optional(v.number()),
        taxEnabled: v.optional(v.boolean()),
        currency: v.optional(v.string()),
        discountAmount: v.optional(v.number()),
        discountEnabled: v.optional(v.boolean()),
        address: v.optional(v.string()),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );
        return await ctx.db.patch(id, filteredUpdates);
    },
});