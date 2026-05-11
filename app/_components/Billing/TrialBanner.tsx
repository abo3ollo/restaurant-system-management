"use client";

import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { Clock, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function TrialBanner() {
    const { isTrialing, daysLeft, isExpired } = useSubscription();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);

    if (!isTrialing || isExpired || dismissed) return null;

    const isUrgent = daysLeft <= 2;
    const isWarning = daysLeft <= 5;

    return (
        <div className={cn(
            "flex items-center justify-center px-5 py-3 text-sm font-medium ",
            isUrgent  ? "bg-red-600 text-white" :
            isWarning ? "bg-amber-500 text-white" :
            "bg-indigo-600 text-white"
        )}>
            <div className="flex items-center gap-2.5">
                <Clock size={15} />
                {daysLeft === 0 ? (
                    <span className="font-bold">⚠️ Your free trial expires today!</span>
                ) : (
                    <span>
                        Your free trial ends in{" "}
                        <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>
                        {" "}— Upgrade now to keep access
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push("/billing")}
                    className="flex items-center gap-1.5 mx-3 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                    Upgrade Now <ArrowRight size={12} />
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}