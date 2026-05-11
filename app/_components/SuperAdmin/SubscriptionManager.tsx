/**
 * Super Admin Subscription Manager Component
 * 
 * Comprehensive UI for managing restaurant subscriptions manually.
 * Supports: manual activation, gift subscriptions, extensions, cancellation.
 */

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
    Calendar, Gift, MoreVertical, AlertCircle, CheckCircle2, 
    Clock, DollarSign, Zap 
} from "lucide-react";

interface SubscriptionManagerProps {
    restaurantId: Id<"restaurants">;
    restaurantName: string;
    currentSubscription?: {
        plan: string;
        status: string;
        daysLeft: number;
        expiresAt: number;
        autoRenew: boolean;
        source: string;
    };
}

export function SubscriptionManager({ 
    restaurantId, 
    restaurantName, 
    currentSubscription 
}: SubscriptionManagerProps) {
    const [loading, setLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [actionType, setActionType] = useState<"manual" | "gift" | "extend" | "cancel" | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
    const [notes, setNotes] = useState("");
    const [extraDays, setExtraDays] = useState(7);

    const manualActivate = useMutation(api.subscriptions.manualActivateSubscription);
    const extendSub = useMutation(api.subscriptions.extendSubscription);
    const cancelSub = useMutation(api.subscriptions.adminCancelSubscription);

    const handleManualActivate = async (source: "manual" | "gift") => {
        setLoading(true);
        try {
            await manualActivate({
                restaurantId,
                plan: selectedPlan,
                source,
                notes: notes || undefined,
            });
            
            const label = source === "gift" ? "Gift subscription" : "Subscription";
            toast.success(`${label} activated for ${restaurantName}`);
            
            setActionType(null);
            setNotes("");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExtend = async () => {
        setLoading(true);
        try {
            await extendSub({
                restaurantId,
                extraDays,
                notes: notes || undefined,
            });
            toast.success(`Subscription extended by ${extraDays} days`);
            setActionType(null);
            setNotes("");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm(`Cancel ${restaurantName}'s subscription?`)) return;
        
        setLoading(true);
        try {
            await cancelSub({
                restaurantId,
                reason: notes || undefined,
            });
            toast.success("Subscription cancelled");
            setActionType(null);
            setNotes("");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Current Status */}
            {currentSubscription && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-neutral-900">Current Subscription</h4>
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-neutral-100 rounded-lg"
                            >
                                <MoreVertical size={16} className="text-neutral-400" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg z-10">
                                    <button
                                        onClick={() => {
                                            setActionType("manual");
                                            setShowMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                                    >
                                        Manual Activate
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType("gift");
                                            setShowMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                                    >
                                        Gift Subscription
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType("extend");
                                            setShowMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 border-b border-neutral-100"
                                    >
                                        Extend
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType("cancel");
                                            setShowMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-neutral-500 text-xs">Plan</p>
                            <p className="font-semibold text-neutral-900 capitalize">
                                {currentSubscription.plan}
                            </p>
                        </div>
                        <div>
                            <p className="text-neutral-500 text-xs">Status</p>
                            <p className={cn(
                                "font-semibold text-sm",
                                currentSubscription.status === "active" ? "text-green-600" :
                                currentSubscription.status === "trialing" ? "text-amber-600" :
                                "text-red-600"
                            )}>
                                {currentSubscription.status}
                            </p>
                        </div>
                        <div>
                            <p className="text-neutral-500 text-xs">Source</p>
                            <p className="font-semibold text-neutral-900 capitalize">
                                {currentSubscription.source}
                            </p>
                        </div>
                        <div>
                            <p className="text-neutral-500 text-xs">Days Left</p>
                            <p className="font-semibold text-neutral-900">
                                {currentSubscription.daysLeft}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-neutral-500 text-xs">Expires</p>
                            <p className="font-semibold text-neutral-900">
                                {new Date(currentSubscription.expiresAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Auto-renew status */}
                    <div className="mt-3 p-2 bg-neutral-50 rounded-lg flex items-center gap-2">
                        <Zap size={14} className={currentSubscription.autoRenew ? "text-green-600" : "text-neutral-400"} />
                        <span className="text-xs text-neutral-600">
                            Auto-renew: <span className="font-semibold">
                                {currentSubscription.autoRenew ? "Enabled" : "Disabled"}
                            </span>
                        </span>
                    </div>
                </div>
            )}

            {/* Action Forms */}
            {actionType === "manual" && (
                <ActionForm
                    title="Manually Activate Subscription"
                    selectedPlan={selectedPlan}
                    onPlanChange={setSelectedPlan}
                    notes={notes}
                    onNotesChange={setNotes}
                    onSubmit={() => handleManualActivate("manual")}
                    onCancel={() => setActionType(null)}
                    loading={loading}
                />
            )}

            {actionType === "gift" && (
                <ActionForm
                    title="Grant Gift Subscription"
                    subtitle="Provide free access without payment"
                    selectedPlan={selectedPlan}
                    onPlanChange={setSelectedPlan}
                    notes={notes}
                    onNotesChange={setNotes}
                    onSubmit={() => handleManualActivate("gift")}
                    onCancel={() => setActionType(null)}
                    loading={loading}
                    icon={<Gift className="text-amber-600" size={20} />}
                />
            )}

            {actionType === "extend" && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
                    <h4 className="font-semibold text-neutral-900">Extend Subscription</h4>
                    
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Extra Days
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={extraDays}
                            onChange={(e) => setExtraDays(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reason for extension..."
                            rows={2}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleExtend}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Extending..." : "Extend"}
                        </button>
                        <button
                            onClick={() => setActionType(null)}
                            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-semibold text-sm hover:bg-neutral-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {actionType === "cancel" && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-4 space-y-4">
                    <div className="flex gap-3">
                        <AlertCircle size={20} className="text-red-600 shrink-0" />
                        <div>
                            <h4 className="font-semibold text-red-900">Cancel Subscription</h4>
                            <p className="text-sm text-red-700 mt-1">
                                This action cannot be undone. The restaurant will lose access immediately.
                            </p>
                        </div>
                    </div>

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Reason for cancellation..."
                        rows={2}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm resize-none"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? "Cancelling..." : "Yes, Cancel"}
                        </button>
                        <button
                            onClick={() => setActionType(null)}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-50"
                        >
                            Abort
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for action forms
function ActionForm({
    title,
    subtitle,
    icon,
    selectedPlan,
    onPlanChange,
    notes,
    onNotesChange,
    onSubmit,
    onCancel,
    loading,
}: any) {
    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
            <div className="flex items-start gap-3">
                {icon && <div>{icon}</div>}
                <div>
                    <h4 className="font-semibold text-neutral-900">{title}</h4>
                    {subtitle && <p className="text-sm text-neutral-600 mt-0.5">{subtitle}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Plan Duration
                </label>
                <div className="flex gap-2">
                    {["monthly", "yearly"].map((plan) => (
                        <button
                            key={plan}
                            onClick={() => onPlanChange(plan)}
                            className={cn(
                                "flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                selectedPlan === plan
                                    ? "bg-blue-600 text-white"
                                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                            )}
                        >
                            {plan === "monthly" ? "Weekly" : "Yearly"}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Notes (optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Add any notes..."
                    rows={2}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-none"
                />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Confirm"}
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-semibold text-sm hover:bg-neutral-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
