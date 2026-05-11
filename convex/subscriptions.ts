import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getRestaurantContext } from "./context";
import {
    getActiveSubscription,
    isSubscriptionActive,
    getSubscriptionRemainingDays,
    getPlanExpirationDate,
    getPlanLabel,
} from "./lib/subscriptionHelpers";

// ── Internal log helper ────────────────────────────────
async function log(
    ctx: any,
    restaurantId: any,
    message: string,
    type: "info" | "success" | "warning" | "error",
    metadata?: string
) {
    await ctx.db.insert("billingLogs", {
        restaurantId,
        message,
        type,
        metadata,
        createdAt: Date.now(),
    });
}

// ── Get current subscription ───────────────────────────
export const getCurrentSubscription = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
            .first();

        if (!user?.restaurantId) return null;

        const sub = await getActiveSubscription(ctx.db, user.restaurantId);
        if (!sub) return null;

        return {
            ...sub,
            isExpired: !isSubscriptionActive(sub),
            daysLeft: getSubscriptionRemainingDays(sub),
            planLabel: getPlanLabel(sub.plan),
        };
    },
});

// ── Get subscription by restaurantId ──────────────────
export const getSubscriptionByRestaurant = query({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, args) => {
        const sub = await getActiveSubscription(ctx.db, args.restaurantId);
        if (!sub) return null;
        return {
            ...sub,
            isExpired: !isSubscriptionActive(sub),
            daysLeft: getSubscriptionRemainingDays(sub),
            planLabel: getPlanLabel(sub.plan),
        };
    },
});

// ── Create trial subscription ──────────────────────────
export const createTrialSubscription = mutation({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiresAt = getPlanExpirationDate("trial", now);

        const subId = await ctx.db.insert("subscriptions", {
            restaurantId: args.restaurantId,
            plan: "trial",
            status: "trialing",
            source: "trial",
            startsAt: now,
            expiresAt,
            trialEndsAt: expiresAt,
            autoRenew: false,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.patch(args.restaurantId, { currentPlan: "free" });

        await log(ctx, args.restaurantId,
            "Free trial started — 7 days unlimited access", "info");

        return subId;
    },
});

// ── Activate via payment ───────────────────────────────
export const activateSubscription = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        plan: v.union(v.literal("monthly"), v.literal("yearly")),
        paymobOrderId: v.string(),
        paymobTransactionId: v.string(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiresAt = getPlanExpirationDate(args.plan, now);

        const existing = await getActiveSubscription(ctx.db, args.restaurantId);

        let subId;
        if (existing) {
            await ctx.db.patch(existing._id, {
                plan: args.plan,
                status: "active",
                source: "payment",
                startsAt: now,
                expiresAt,
                autoRenew: true,
                paymobOrderId: args.paymobOrderId,
                paymobTransactionId: args.paymobTransactionId,
                paymentProvider: "paymob",
                updatedAt: now,
            });
            subId = existing._id;
        } else {
            subId = await ctx.db.insert("subscriptions", {
                restaurantId: args.restaurantId,
                plan: args.plan,
                status: "active",
                source: "payment",
                startsAt: now,
                expiresAt,
                autoRenew: true,
                paymobOrderId: args.paymobOrderId,
                paymobTransactionId: args.paymobTransactionId,
                paymentProvider: "paymob",
                createdAt: now,
                updatedAt: now,
            });
        }

        await ctx.db.insert("billingPayments", {
            restaurantId: args.restaurantId,
            subscriptionId: subId,
            amount: args.amount,
            currency: "EGP",
            status: "success",
            provider: "paymob",
            transactionId: args.paymobTransactionId,
            paymobOrderId: args.paymobOrderId,
            createdAt: now,
        });

        await ctx.db.patch(args.restaurantId, {
            currentPlan: args.plan, // "monthly" or "yearly" — matches schema literals
        });

        await log(ctx, args.restaurantId,
            `Payment successful — ${getPlanLabel(args.plan)} activated (${args.amount} EGP)`,
            "success",
            JSON.stringify({ transactionId: args.paymobTransactionId })
        );

        return subId;
    },
});

// ── Manual activation by super admin ──────────────────
export const manualActivateSubscription = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        plan: v.union(v.literal("monthly"), v.literal("yearly")),
        source: v.union(v.literal("manual"), v.literal("gift"), v.literal("promo")),
        notes: v.optional(v.string()),
        customExpiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const now = Date.now();
        const expiresAt = args.customExpiresAt ?? getPlanExpirationDate(args.plan, now);

        const existing = await getActiveSubscription(ctx.db, args.restaurantId);

        let subId;
        if (existing) {
            await ctx.db.patch(existing._id, {
                plan: args.plan,
                status: "active",
                source: args.source,
                startsAt: now,
                expiresAt,
                autoRenew: false,
                grantedBy: identity.subject,
                notes: args.notes,
                updatedAt: now,
            });
            subId = existing._id;
        } else {
            subId = await ctx.db.insert("subscriptions", {
                restaurantId: args.restaurantId,
                plan: args.plan,
                status: "active",
                source: args.source,
                startsAt: now,
                expiresAt,
                autoRenew: false,
                grantedBy: identity.subject,
                notes: args.notes,
                createdAt: now,
                updatedAt: now,
            });
        }

        await ctx.db.patch(args.restaurantId, {
            currentPlan: args.plan, // "monthly" or "yearly" — matches schema literals
        });

        const sourceLabel =
            args.source === "gift" ? "gifted" :
                args.source === "promo" ? "promo" : "manually activated";

        await log(ctx, args.restaurantId,
            `Super admin ${sourceLabel} ${getPlanLabel(args.plan)} — expires ${new Date(expiresAt).toLocaleDateString()}`,
            "info",
            JSON.stringify({ grantedBy: identity.subject, notes: args.notes })
        );

        return subId;
    },
});

// ── Extend subscription ────────────────────────────────
export const extendSubscription = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        extraDays: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const sub = await getActiveSubscription(ctx.db, args.restaurantId);
        if (!sub) throw new Error("No subscription found");

        const now = Date.now();
        const currentExpiry = Math.max(sub.expiresAt, now);
        const newExpiry = currentExpiry + args.extraDays * 24 * 60 * 60 * 1000;

        await ctx.db.patch(sub._id, {
            expiresAt: newExpiry,
            status: "active",
            updatedAt: now,
        });

        await log(ctx, args.restaurantId,
            `Subscription extended by ${args.extraDays} days by super admin${args.notes ? ` — ${args.notes}` : ""}`,
            "info",
            JSON.stringify({ grantedBy: identity.subject })
        );
    },
});

// ── Cancel subscription ────────────────────────────────
export const cancelSubscription = mutation({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        const now = Date.now();

        const sub = await getActiveSubscription(ctx.db, restaurantId);
        if (!sub) throw new Error("No subscription found");

        await ctx.db.patch(sub._id, {
            status: "cancelled",
            cancelledAt: now,
            autoRenew: false,
            updatedAt: now,
        });

        await log(ctx, restaurantId, "Subscription cancelled by user", "warning");
    },
});

// ── Cancel by super admin ──────────────────────────────
export const adminCancelSubscription = mutation({
    args: {
        restaurantId: v.id("restaurants"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const now = Date.now();
        const sub = await getActiveSubscription(ctx.db, args.restaurantId);
        if (!sub) throw new Error("No subscription found");

        await ctx.db.patch(sub._id, {
            status: "cancelled",
            cancelledAt: now,
            autoRenew: false,
            updatedAt: now,
        });

        await ctx.db.patch(args.restaurantId, { currentPlan: "free" });

        await log(ctx, args.restaurantId,
            `Subscription cancelled by super admin${args.reason ? ` — ${args.reason}` : ""}`,
            "warning",
            JSON.stringify({ cancelledBy: identity.subject })
        );
    },
});

// ── Toggle auto renew ──────────────────────────────────
export const toggleAutoRenew = mutation({
    args: { autoRenew: v.boolean() },
    handler: async (ctx, args) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        const sub = await getActiveSubscription(ctx.db, restaurantId);
        if (!sub) throw new Error("No subscription found");

        await ctx.db.patch(sub._id, {
            autoRenew: args.autoRenew,
            updatedAt: Date.now(),
        });

        await log(ctx, restaurantId,
            `Auto-renew ${args.autoRenew ? "enabled" : "disabled"}`, "info");
    },
});

// ── Mark expired (cron) ────────────────────────────────
export const markExpiredSubscriptions = internalMutation({
    handler: async (ctx) => {
        const now = Date.now();
        const active = await ctx.db
            .query("subscriptions")
            .filter(q =>
                q.and(
                    q.neq(q.field("status"), "expired"),
                    q.neq(q.field("status"), "cancelled"),
                    q.lt(q.field("expiresAt"), now)
                )
            )
            .collect();

        for (const sub of active) {
            await ctx.db.patch(sub._id, {
                status: "expired",
                updatedAt: now,
            });
            await ctx.db.patch(sub.restaurantId, { currentPlan: "free" });
            await ctx.db.insert("billingLogs", {
                restaurantId: sub.restaurantId,
                message: `${getPlanLabel(sub.plan)} subscription expired`,
                type: "error",
                createdAt: now,
            });
        }

        return active.length;
    },
});

// ── Get billing payments ───────────────────────────────
export const getBillingPayments = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        return await ctx.db
            .query("billingPayments")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .order("desc")
            .collect();
    },
});

export const getBillingPaymentByTransaction = query({
    args: { transactionId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("billingPayments")
            .withIndex("by_transaction", q => q.eq("transactionId", args.transactionId))
            .first();
    },
});

// ── Get billing logs ───────────────────────────────────
export const getBillingLogs = query({
    handler: async (ctx) => {
        const { restaurantId } = await getRestaurantContext(ctx);
        return await ctx.db
            .query("billingLogs")
            .withIndex("by_restaurant", q => q.eq("restaurantId", restaurantId))
            .order("desc")
            .collect();
    },
});

export const getBillingLogsByRestaurant = query({
    args: { restaurantId: v.id("restaurants") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("billingLogs")
            .withIndex("by_restaurant", q => q.eq("restaurantId", args.restaurantId))
            .order("desc")
            .collect();
    },
});

// ── Get all subscriptions (super admin) ───────────────
export const getAllSubscriptions = query({
    handler: async (ctx) => {
        const subs = await ctx.db.query("subscriptions").order("desc").collect();
        return await Promise.all(subs.map(async sub => {
            const restaurant = await ctx.db.get(sub.restaurantId);
            return {
                ...sub,
                restaurantName: restaurant?.name ?? "Unknown",
                isExpired: !isSubscriptionActive(sub),
                daysLeft: getSubscriptionRemainingDays(sub),
                planLabel: getPlanLabel(sub.plan),
            };
        }));
    },
});