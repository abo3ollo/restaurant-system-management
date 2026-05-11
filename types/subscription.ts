/**
 * Subscription System Types
 * 
 * This file contains all TypeScript types and interfaces for the SaaS subscription architecture.
 * All subscription logic depends on the subscriptions table only.
 * Restaurant.currentPlan is a display field that mirrors the active subscription.
 */

import { Id } from "@/convex/_generated/dataModel";

/**
 * Plan Types
 */
export type PlanType = "trial" | "monthly" | "weekly" | "yearly";
export type SubscriptionPlan = "trial" | "weekly" | "yearly";

/**
 * Subscription Status
 */
export type SubscriptionStatus = 
    | "trialing"
    | "active"
    | "expired"
    | "cancelled"
    | "past_due";

/**
 * Subscription Source
 * Determines how the subscription was created
 */
export type SubscriptionSource = 
    | "payment"      // Paid via payment provider
    | "manual"       // Admin manually activated
    | "gift"         // Gift subscription
    | "promo"        // Marketing/promo code
    | "trial";       // Trial subscription

/**
 * Base Subscription Record
 */
export interface Subscription {
    _id: Id<"subscriptions">;
    _creationTime: number;
    restaurantId: Id<"restaurants">;
    plan: PlanType;
    status: SubscriptionStatus;
    source: SubscriptionSource;
    startsAt: number;
    expiresAt: number;
    trialEndsAt?: number;
    cancelledAt?: number;
    autoRenew: boolean;
    grantedBy?: string; // Clerk ID of admin
    paymobOrderId?: string;
    paymobTransactionId?: string;
    paymentProvider?: string;
    paymentMethod?: string;
    notes?: string;
    createdAt: number;
    updatedAt: number;
}

/**
 * Subscription with Computed Fields
 */
export interface SubscriptionWithStatus extends Subscription {
    isExpired: boolean;
    daysLeft: number;
    planLabel: string;
}

/**
 * Billing Log Entry
 */
export interface BillingLog {
    _id: Id<"billingLogs">;
    _creationTime: number;
    restaurantId: Id<"restaurants">;
    type: "info" | "success" | "warning" | "error";
    message: string;
    metadata?: string;
    createdAt: number;
}

/**
 * Billing Payment Record
 */
export interface BillingPayment {
    _id: Id<"billingPayments">;
    _creationTime: number;
    restaurantId: Id<"restaurants">;
    subscriptionId: Id<"subscriptions">;
    amount: number;
    currency: string;
    status: "pending" | "success" | "failed" | "refunded";
    provider: string;
    transactionId?: string;
    method?: string;
    paymobOrderId?: string;
    createdAt: number;
}

/**
 * Restaurant with Subscription Info
 */
export interface RestaurantWithSubscription {
    _id: Id<"restaurants">;
    name: string;
    slug: string;
    currentPlan?: "free" | "weekly" | "yearly";
    status: "active" | "suspended";
    subscription?: SubscriptionWithStatus;
    subscriptionExpired?: boolean;
    canAccessPlatform: boolean;
}

/**
 * Subscription Change Request (for mutations)
 */
export interface ManualSubscriptionRequest {
    restaurantId: Id<"restaurants">;
    plan: "monthly" | "yearly";
    source: "manual" | "gift" | "promo";
    notes?: string;
    customExpiresAt?: number;
}

/**
 * Subscription Extension Request
 */
export interface ExtendSubscriptionRequest {
    restaurantId: Id<"restaurants">;
    extraDays: number;
    notes?: string;
}

/**
 * Plan Configuration
 */
export interface PlanConfig {
    id: PlanType;
    label: string;
    durationDays: number;
    features: string[];
}

/**
 * Subscription Status Response
 */
export interface SubscriptionStatusResponse {
    isActive: boolean;
    isPaid: boolean;
    isExpired: boolean;
    daysLeft: number;
    planLabel: string;
    renewsOn?: string;
    canAccessPlatform: boolean;
}

/**
 * Admin Subscription Action Response
 */
export interface AdminSubscriptionActionResponse {
    success: boolean;
    message: string;
    subscriptionId: Id<"subscriptions">;
    logId: Id<"billingLogs">;
}
