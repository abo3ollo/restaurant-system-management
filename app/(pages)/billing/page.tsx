"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    CheckCircle2, Clock, XCircle, AlertTriangle,
    Zap, RefreshCw, Loader2, DollarSign,
    FileText, Shield, Gift, Sparkles,
    Crown, Star, Tag,
} from "lucide-react";

// ── Source badge config ────────────────────────────────
const SOURCE_CONFIG = {
    payment: { label: "Paid",          icon: DollarSign, cls: "bg-green-100 text-green-700" },
    manual:  { label: "Admin Granted", icon: Crown,      cls: "bg-indigo-100 text-indigo-700" },
    gift:    { label: "Gift",          icon: Gift,       cls: "bg-pink-100 text-pink-700" },
    promo:   { label: "Promo Code",    icon: Tag,        cls: "bg-purple-100 text-purple-700" },
    trial:   { label: "Free Trial",    icon: Star,       cls: "bg-amber-100 text-amber-700" },
};

const PLANS = [
    {
        key: "trial",
        label: "Free Trial",
        price: "Free",
        period: "7 days",
        color: "border-neutral-200",
        btnClass: "bg-neutral-100 text-neutral-500 cursor-default",
        features: [
            "✅ All Features included",
            "✅ No Credit Card Required",
            "⏱ 7 Days Only",
        ],
    },
    {
        key: "monthly",
        label: "Monthly Plan",
        price: "800 EGP",
        period: "per month",
        color: "border-indigo-300",
        btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
        features: [
            "✅ Unlimited Everything",
            "✅ Priority Support",
            "✅ Analytics",
            "✅ Multi-branch",
            "✅ Auto Renew",
        ],
    },
    {
        key: "yearly",
        label: "Yearly Plan",
        price: "14,400 EGP",
        period: "per year",
        color: "border-green-300",
        btnClass: "bg-green-600 hover:bg-green-700 text-white",
        badge: "Save 20%",
        features: [
            "✅ Everything in Monthly",
            "✅ Save 3,600 EGP/year",
            "✅ Priority Support",
            "✅ Analytics",
            "✅ Auto Renew",
        ],
    },
];

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { icon: any; label: string; cls: string }> = {
        trialing:  { icon: Clock,          label: "Free Trial", cls: "bg-amber-100 text-amber-700" },
        active:    { icon: CheckCircle2,   label: "Active",     cls: "bg-green-100 text-green-700" },
        expired:   { icon: XCircle,        label: "Expired",    cls: "bg-red-100 text-red-600" },
        cancelled: { icon: AlertTriangle,  label: "Cancelled",  cls: "bg-neutral-100 text-neutral-500" },
        past_due:  { icon: AlertTriangle,  label: "Past Due",   cls: "bg-orange-100 text-orange-600" },
    };
    const c = configs[status] ?? configs.expired;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold", c.cls)}>
            <Icon size={12} />{c.label}
        </span>
    );
}

function SourceBadge({ source }: { source?: string }) {
    if (!source) return null;
    const c = SOURCE_CONFIG[source as keyof typeof SOURCE_CONFIG];
    if (!c) return null;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold", c.cls)}>
            <Icon size={10} />{c.label}
        </span>
    );
}

export default function BillingPage() {
    const { user } = useUser();
    const router = useRouter();
    const { subscription, isTrialing, daysLeft, planLabel, isExpired, sourceLabel } = useSubscription();
    const payments = useQuery(api.subscriptions.getBillingPayments);
    const logs = useQuery(api.subscriptions.getBillingLogs);
    const cancelSub = useMutation(api.subscriptions.cancelSubscription);
    const toggleRenew = useMutation(api.subscriptions.toggleAutoRenew);

    const [payingPlan, setPayingPlan] = useState<"monthly" | "yearly" | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async (plan: "monthly" | "yearly") => {
        if (!user) return;
        setPayingPlan(plan);
        setLoading(true);
        try {
            const res = await fetch("/api/paymob/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan,
                    restaurantId: "restaurant_id_here", // You'll need to get this from context
                    restaurantName: "My Restaurant",
                    email: user.emailAddresses[0]?.emailAddress,
                    name: user.fullName,
                }),
            });
            const data = await res.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                toast.error("Failed to create payment session");
            }
        } catch {
            toast.error("Payment error. Please try again.");
        } finally {
            setLoading(false);
            setPayingPlan(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Cancel your subscription? You'll still have access until the current period ends.")) return;
        try {
            await cancelSub();
            toast.success("Subscription cancelled");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" });
    const formatTime = (ts: number) =>
        new Date(ts).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-neutral-900">Billing & Subscription</h1>
                        <p className="text-sm text-neutral-400 mt-1">Manage your plan, payments, and billing history</p>
                    </div>
                    <button onClick={() => router.back()}
                        className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-white transition-colors">
                        ← Back
                    </button>
                </div>

                {/* Expired Banner */}
                {isExpired && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                            <XCircle size={22} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-red-700">Your subscription has expired</p>
                            <p className="text-xs text-red-500 mt-0.5">Upgrade to regain full access to the POS system</p>
                        </div>
                        <button onClick={() => handleUpgrade("monthly")}
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors">
                            Upgrade Now
                        </button>
                    </div>
                )}

                {/* Trial Banner */}
                {isTrialing && !isExpired && (
                    <div className={cn(
                        "rounded-2xl p-5 flex items-center gap-4 border",
                        daysLeft <= 2 ? "bg-red-50 border-red-200" :
                        daysLeft <= 4 ? "bg-amber-50 border-amber-200" :
                        "bg-indigo-50 border-indigo-100"
                    )}>
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                            daysLeft <= 2 ? "bg-red-100" : daysLeft <= 4 ? "bg-amber-100" : "bg-indigo-100"
                        )}>
                            <Clock size={22} className={daysLeft <= 2 ? "text-red-500" : daysLeft <= 4 ? "text-amber-500" : "text-indigo-500"} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-neutral-800">
                                Free trial ends in <span className="text-indigo-600">{daysLeft} days</span>
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                Expires on {subscription ? formatDate(subscription.expiresAt) : ""}
                            </p>
                        </div>
                        <div className="h-2 w-24 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full", daysLeft <= 2 ? "bg-red-500" : daysLeft <= 4 ? "bg-amber-500" : "bg-indigo-500")}
                                style={{ width: `${(daysLeft / 7) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Current Plan Card */}
                {subscription && (
                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                                    Current Plan
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-xl font-black text-neutral-900">{planLabel}</h2>
                                    <StatusBadge status={subscription.status} />
                                    <SourceBadge source={subscription.source} />
                                </div>
                                {subscription.source !== "payment" && subscription.source !== "trial" && (
                                    <p className="text-xs text-neutral-400 mt-1">
                                        {subscription.source === "gift"   && "🎁 This subscription was gifted to you"}
                                        {subscription.source === "manual" && "⚡ Activated by admin"}
                                        {subscription.source === "promo"  && "🏷️ Promo access granted"}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-neutral-400 mb-1">
                                    {subscription.status === "trialing" ? "Trial ends" : "Expires"}
                                </p>
                                <p className="text-sm font-bold text-neutral-700">
                                    {formatDate(subscription.expiresAt)}
                                </p>
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-5 gap-3 mb-5">
                            {[
                                { label: "Plan",    value: planLabel },
                                { label: "Status",  value: subscription.status },
                                { label: "Source",  value: sourceLabel },
                                { label: "Started", value: formatTime(subscription.startsAt) },
                                { label: "Expires", value: formatTime(subscription.expiresAt) },
                            ].map(s => (
                                <div key={s.label} className="bg-neutral-50 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{s.label}</p>
                                    <p className="text-xs font-bold text-neutral-800 capitalize">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Auto renew toggle — only for paid subscriptions */}
                        {subscription.status === "active" && subscription.source === "payment" && (
                            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                                <div className="flex items-center gap-2">
                                    <RefreshCw size={14} className="text-neutral-400" />
                                    <span className="text-sm font-semibold text-neutral-600">Auto Renew</span>
                                    <span className="text-xs text-neutral-400">
                                        ({subscription.autoRenew ? "enabled" : "disabled"})
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleRenew({ autoRenew: !subscription.autoRenew })}
                                        className={cn(
                                            "relative w-10 h-5 rounded-full transition-colors",
                                            subscription.autoRenew ? "bg-green-500" : "bg-neutral-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                                            subscription.autoRenew ? "left-5" : "left-0.5"
                                        )} />
                                    </button>
                                    <button onClick={handleCancel}
                                        className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                                        Cancel Subscription
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Manual/Gift/Promo note */}
                        {subscription.status === "active" &&
                         (subscription.source === "manual" || subscription.source === "gift" || subscription.source === "promo") && (
                            <div className="pt-4 border-t border-neutral-100">
                                <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                                    <Shield size={11} />
                                    {subscription.source === "gift"   && "This subscription was gifted — no auto-renewal"}
                                    {subscription.source === "manual" && "Admin-activated subscription — no auto-renewal"}
                                    {subscription.source === "promo"  && "Promo subscription — no auto-renewal"}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Pricing Cards - Always Visible */}
                <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                        Available Plans
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {PLANS.map(plan => {
                            const isCurrent = subscription?.plan === plan.key;
                            return (
                                <div key={plan.key} className={cn(
                                    "relative bg-white rounded-2xl border-2 p-5 transition-all",
                                    isCurrent ? "border-indigo-400 shadow-md shadow-indigo-50" : plan.color,
                                    !isCurrent && "hover:shadow-sm"
                                )}>
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">
                                            Current Plan
                                        </div>
                                    )}
                                    {plan.badge && (
                                        <div className="absolute -top-3 right-4 bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">
                                            {plan.badge}
                                        </div>
                                    )}

                                    <p className="text-sm font-black text-neutral-900 mb-1">{plan.label}</p>
                                    <div className="mb-4">
                                        <span className="text-2xl font-black text-neutral-900">{plan.price}</span>
                                        <span className="text-xs text-neutral-400 ml-1">{plan.period}</span>
                                    </div>

                                    <ul className="space-y-1.5 mb-5">
                                        {plan.features.map(f => (
                                            <li key={f} className="text-xs text-neutral-600">{f}</li>
                                        ))}
                                    </ul>

                                    {plan.key === "trial" ? (
                                        <div className="w-full py-2.5 rounded-xl bg-neutral-100 text-neutral-400 text-xs font-bold text-center">
                                            {isCurrent ? "Current Plan" : "Trial Only"}
                                        </div>
                                    ) : isCurrent && subscription?.status === "active" ? (
                                        <div className="w-full py-2.5 rounded-xl bg-green-50 text-green-600 text-xs font-bold text-center border border-green-100">
                                            ✓ Active
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleUpgrade(plan.key as "monthly" | "yearly")}
                                            disabled={loading}
                                            className={cn(
                                                "w-full py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                                                plan.btnClass
                                            )}>
                                            {loading && payingPlan === plan.key
                                                ? <><Loader2 size={13} className="animate-spin" /> Processing...</>
                                                : <><Zap size={13} /> Upgrade to {plan.label}</>
                                            }
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
                        <DollarSign size={15} className="text-neutral-500" />
                        <h3 className="text-sm font-black text-neutral-800">Payment History</h3>
                    </div>
                    {!payments || payments.length === 0 ? (
                        <div className="text-center py-10 text-neutral-400">
                            <FileText size={28} className="mx-auto mb-2" />
                            <p className="text-sm font-semibold">No payments yet</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100">
                                    {["Date", "Amount", "Method", "Status", "Transaction ID"].map(h => (
                                        <th key={h} className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-5 py-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                                        <td className="px-5 py-3 text-sm text-neutral-600">{formatTime(p.createdAt)}</td>
                                        <td className="px-5 py-3 text-sm font-black text-neutral-800">{p.amount} {p.currency}</td>
                                        <td className="px-5 py-3 text-sm text-neutral-500 capitalize">{p.method ?? "Card"}</td>
                                        <td className="px-5 py-3">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                                                p.status === "success" ? "bg-green-100 text-green-700" :
                                                p.status === "failed"  ? "bg-red-100 text-red-600" :
                                                "bg-neutral-100 text-neutral-500"
                                            )}>{p.status}</span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-neutral-400 font-mono">
                                            {p.transactionId ? `${p.transactionId.slice(0, 12)}...` : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Billing Logs */}
                <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
                        <Shield size={15} className="text-neutral-500" />
                        <h3 className="text-sm font-black text-neutral-800">Billing Activity</h3>
                    </div>
                    {!logs || logs.length === 0 ? (
                        <div className="text-center py-8 text-neutral-400 text-sm">No activity yet</div>
                    ) : (
                        <div className="divide-y divide-neutral-50">
                            {logs.slice(0, 10).map(log => (
                                <div key={log._id} className="flex items-start gap-3 px-5 py-3">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                        log.type === "success" ? "bg-green-500" :
                                        log.type === "warning" ? "bg-amber-500" :
                                        log.type === "error"   ? "bg-red-500" :
                                        "bg-blue-400"
                                    )} />
                                    <div className="flex-1">
                                        <p className="text-sm text-neutral-700">{log.message}</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">{formatTime(log.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}