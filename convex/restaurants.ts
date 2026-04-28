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

                return {
                    ...r,
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

        const recentOrders = await Promise.all(
            orders.slice(0, 10).map(async (order) => {
                const table = await ctx.db.get(order.tableId);
                return { ...order, tableName: table?.name ?? "Unknown" };
            })
        );

        const totalRevenue = orders
            .filter(o => o.status === "paid")
            .reduce((sum, o) => sum + o.total, 0);

        const cashRevenue = payments
            .filter(p => p.method === "cash")
            .reduce((sum, p) => sum + p.amount, 0);

        const cardRevenue = payments
            .filter(p => p.method === "card")
            .reduce((sum, p) => sum + p.amount, 0);

        // Daily revenue last 7 days
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

        return {
            ...restaurant,
            users,
            recentOrders,
            menuItemCount: menuItems.length,
            tableCount: tables.length,
            totalOrders: orders.length,
            paidOrders: orders.filter(o => o.status === "paid").length,
            totalRevenue,
            cashRevenue,
            cardRevenue,
            dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({
                label: new Date(date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }),
                revenue,
            })),
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
            .unique();
        if (existing) throw new Error("Slug already taken");

        const restaurantId = await ctx.db.insert("restaurants", {
            name: args.name,
            slug: args.slug,
            address: args.address,
            phone: args.phone,
            plan: "free",
            status: "active",
            createdAt: Date.now(),
        });

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                restaurantId,
                role: "admin",
            });
        } else {
            await ctx.db.insert("users", {
                clerkId: args.clerkId,
                name: args.ownerName,
                email: args.ownerEmail,
                role: "admin",
                restaurantId,
            });
        }

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
        plan: v.optional(v.union(
            v.literal("free"),
            v.literal("pro"),
            v.literal("enterprise")
        )),
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