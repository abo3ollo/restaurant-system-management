"use client";

import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { Clock, CheckCircle, XCircle, AlertTriangle, Gift, Crown, Tag } from "lucide-react";

export default function SubscriptionBadge() {
    const { subscription, daysLeft, planLabel } = useSubscription();
    if (!subscription) return null;

    const statusConfigs = {
        trialing:  { icon: Clock,         label: `Trial · ${daysLeft}d left`, cls: "bg-amber-100 text-amber-700 border-amber-200" },
        active:    { icon: CheckCircle,   label: planLabel,                   cls: "bg-green-100 text-green-700 border-green-200" },
        expired:   { icon: XCircle,       label: "Expired",                   cls: "bg-red-100 text-red-600 border-red-200" },
        cancelled: { icon: AlertTriangle, label: "Cancelled",                 cls: "bg-neutral-100 text-neutral-500 border-neutral-200" },
        past_due:  { icon: AlertTriangle, label: "Past Due",                  cls: "bg-orange-100 text-orange-600 border-orange-200" },
    };

    // Override icon for special sources
    const sourceIcon =
        subscription.source === "gift"   ? Gift  :
        subscription.source === "manual" ? Crown :
        subscription.source === "promo"  ? Tag   : null;

    const config = statusConfigs[subscription.status as keyof typeof statusConfigs] ?? statusConfigs.expired;
    const Icon = sourceIcon ?? config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border",
            config.cls
        )}>
            <Icon size={11} />
            {config.label}
            {subscription.source === "gift"   && " 🎁"}
            {subscription.source === "manual" && " ⚡"}
            {subscription.source === "promo"  && " 🏷️"}
        </span>
    );
}