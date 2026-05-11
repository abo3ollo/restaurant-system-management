"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo } from "react";
import type { SubscriptionWithStatus } from "@/types/subscription";

interface UseSubscriptionReturn {
    subscription: SubscriptionWithStatus | null | undefined;
    isLoading: boolean;
    isActive: boolean;
    isTrialing: boolean; 
    isExpired: boolean;
    daysLeft: number;
    planLabel: string;
    canAccess: boolean;
    isManual: boolean;
    isPaid: boolean;
    autoRenews: boolean;
    sourceLabel: string;
}


export function useSubscription(): UseSubscriptionReturn {
    const subscription = useQuery(api.subscriptions.getCurrentSubscription);
    
    const computed = useMemo(() => {
        const isTrialing = subscription?.status === "trialing";
        const isActive = subscription?.status === "active";
        const isExpired = subscription?.isExpired ?? false;
        
        const sourceLabel = 
            subscription?.source === "payment" ? "Paid" :
            subscription?.source === "manual"  ? "Admin Granted" :
            subscription?.source === "gift"    ? "Gift" :
            subscription?.source === "promo"   ? "Promo" :
            subscription?.source === "trial"   ? "Trial" :
            "";
        
        return {
            isActive: isActive || isTrialing,
            isTrialing,
            isExpired,
            daysLeft: subscription?.daysLeft ?? 0,
            planLabel: subscription?.planLabel ?? "Unknown",
            canAccess: (isActive || isTrialing) && !isExpired,
            isManual: subscription?.source === "manual" || 
                     subscription?.source === "gift" || 
                     subscription?.source === "promo",
            isPaid: subscription?.source === "payment",
            autoRenews: subscription?.autoRenew ?? false,
            sourceLabel,
        };
    }, [subscription]);
    
    return {
        subscription,
        isLoading: subscription === undefined,
        ...computed,
    };
}

/**
 * Hook to get subscription info for admin page (requires restaurantId)
 */
export function useRestaurantSubscription(restaurantId: string | null) {
    const subscription = useQuery(
        api.subscriptions.getSubscriptionByRestaurant,
        restaurantId ? { restaurantId: restaurantId as any } : "skip"
    );
    
    const computed = useMemo(() => {
        const isActive = subscription?.status === "active" || subscription?.status === "trialing";
        const isExpired = subscription?.isExpired ?? false;
        
        return {
            isActive,
            isExpired,
            daysLeft: subscription?.daysLeft ?? 0,
            planLabel: subscription?.planLabel ?? "Unknown",
            canAccess: isActive && !isExpired,
        };
    }, [subscription]);
    
    return {
        subscription,
        isLoading: subscription === undefined,
        ...computed,
    };
}

/**
 * Hook to check if user can perform an action
 */
export function useCanPerformAction() {
    const { isActive, canAccess } = useSubscription();
    
    return {
        canCreateOrder: canAccess,
        canViewAnalytics: canAccess,
        canManageMenu: canAccess,
        canManageStaff: isActive,
        canExportData: isActive,
    };
}

/**
 * Hook for subscription warning banner
 */
export function useSubscriptionWarning() {
    const { isExpired, daysLeft, subscription } = useSubscription();
    
    return useMemo(() => {
        if (!subscription) return null;
        
        if (isExpired) {
            return {
                type: "error" as const,
                title: "Subscription Expired",
                message: "Your subscription has expired. Please renew to continue using the platform.",
                action: "Renew Now",
            };
        }
        
        if (daysLeft <= 3) {
            return {
                type: "warning" as const,
                title: "Subscription Expiring Soon",
                message: `Your subscription expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
                action: "Renew",
            };
        }
        
        if (daysLeft <= 7 && subscription.autoRenew === false) {
            return {
                type: "info" as const,
                title: "Subscription Won't Auto-Renew",
                message: `Your subscription expires in ${daysLeft} days and won't auto-renew`,
                action: "Enable Auto-Renew",
            };
        }
        
        return null;
    }, [subscription, isExpired, daysLeft]);
}

/**
 * Hook for subscription status badge
 */
export function useSubscriptionStatusBadge() {
    const { subscription, isExpired } = useSubscription();
    
    return useMemo(() => {
        if (!subscription) return null;
        
        const statusBgColor =
            subscription.status === "trialing" ? "bg-amber-100" :
            subscription.status === "active"   ? "bg-green-100" :
            subscription.status === "expired"  ? "bg-red-100" :
            "bg-neutral-100";
        
        const statusTextColor =
            subscription.status === "trialing" ? "text-amber-700" :
            subscription.status === "active"   ? "text-green-700" :
            subscription.status === "expired"  ? "text-red-600" :
            "text-neutral-500";
        
        return {
            bgColor: statusBgColor,
            textColor: statusTextColor,
            display: isExpired ? "Expired" : subscription.planLabel,
        };
    }, [subscription, isExpired]);
}