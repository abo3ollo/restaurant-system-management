"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import {
    ArrowLeft, Store, Users, ShoppingBag, DollarSign,
    UtensilsCrossed, BookOpen, Pause, Play,
    Clock, CreditCard, Banknote, CheckCircle2,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from "recharts";

const STATUS_STYLE: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    preparing: "bg-orange-100 text-orange-700",
    served:    "bg-green-100 text-green-700",
    paid:      "bg-neutral-100 text-neutral-500",
};

const ROLE_STYLE: Record<string, string> = {
    admin:   "bg-indigo-100 text-indigo-700",
    cashier: "bg-amber-100 text-amber-700",
    waiter:  "bg-emerald-100 text-emerald-700",
};

function timeAgo(ts: number) {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff === 0) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

export default function RestaurantDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"overview" | "staff" | "orders">("overview");

    const restaurant = useQuery(
        api.restaurants.getRestaurantById,
        { id: id as Id<"restaurants"> }
    );
    const updateRestaurant = useMutation(api.restaurants.updateRestaurant);
    const [updating, setUpdating] = useState(false);

    if (!restaurant) return (
        <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                    <span className="text-white font-black text-lg leading-none">f</span>
                </div>
                <p className="text-sm text-neutral-400">Loading...</p>
            </div>
        </div>
    );

    const handleToggleStatus = async () => {
        setUpdating(true);
        try {
            await updateRestaurant({
                id: restaurant._id,
                status: restaurant.status === "active" ? "suspended" : "active",
            });
            toast.success(restaurant.status === "active" ? "Restaurant suspended" : "Restaurant activated");
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePlan = async (plan: "free" | "pro" | "enterprise") => {
        setUpdating(true);
        try {
            await updateRestaurant({ id: restaurant._id, plan });
            toast.success(`Plan changed to ${plan}`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#F5F5F3]"
            style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}
        >
            {/* ── Top Header ── */}
            <div className="bg-white border-b border-neutral-100 px-8 py-5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft size={16} className="text-neutral-600" />
                    </button>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-black text-indigo-600">
                                {restaurant.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-neutral-900">{restaurant.name}</h1>
                            <p className="text-xs text-neutral-400">/{restaurant.slug}</p>
                        </div>
                    </div>

                    {/* Plan selector */}
                    <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
                        {(["free", "pro", "enterprise"] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => handleChangePlan(p)}
                                disabled={updating}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                                    restaurant.plan === p
                                        ? "bg-white text-neutral-900 shadow-sm"
                                        : "text-neutral-400 hover:text-neutral-600"
                                )}
                            >{p}</button>
                        ))}
                    </div>

                    {/* Status toggle */}
                    <button
                        onClick={handleToggleStatus}
                        disabled={updating}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50",
                            restaurant.status === "active"
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-600"
                                : "bg-green-50 hover:bg-green-100 text-green-600"
                        )}
                    >
                        {restaurant.status === "active" ? (
                            <><Pause size={13} /> Suspend</>
                        ) : (
                            <><Play size={13} /> Activate</>
                        )}
                    </button>

                    {/* Status badge */}
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold",
                        restaurant.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                    )}>
                        {restaurant.status === "active" && (
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                        {restaurant.status}
                    </span>
                </div>
            </div>

            <div className="p-8 space-y-6">

                {/* ── Stats ── */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: "Total Staff",   value: restaurant.users.length, icon: Users,          color: "bg-indigo-100 text-indigo-600" },
                        { label: "Menu Items",    value: restaurant.menuItemCount, icon: BookOpen,       color: "bg-amber-100 text-amber-600" },
                        { label: "Tables",        value: restaurant.tableCount,   icon: UtensilsCrossed, color: "bg-blue-100 text-blue-600" },
                        { label: "Total Orders",  value: restaurant.totalOrders,  icon: ShoppingBag,    color: "bg-purple-100 text-purple-600" },
                    ].map(s => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">{s.label}</p>
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", s.color)}>
                                        <Icon size={14} />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Revenue cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={14} className="text-emerald-600" />
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">Total Revenue</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-600">${restaurant.totalRevenue.toFixed(2)}</p>
                        <p className="text-xs text-neutral-400 mt-1">{restaurant.paidOrders} paid orders</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Banknote size={14} className="text-green-600" />
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">Cash Revenue</p>
                        </div>
                        <p className="text-2xl font-black text-green-600">${restaurant.cashRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard size={14} className="text-blue-600" />
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">Card Revenue</p>
                        </div>
                        <p className="text-2xl font-black text-blue-600">${restaurant.cardRevenue.toFixed(2)}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit">
                    {(["overview", "staff", "orders"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize",
                                activeTab === t
                                    ? "bg-white text-neutral-900 shadow-sm"
                                    : "text-neutral-400 hover:text-neutral-600"
                            )}
                        >{t}</button>
                    ))}
                </div>

                {/* ── Overview Tab ── */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-2 gap-6">
                        {/* Revenue Chart */}
                        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                            <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests mb-5">
                                Revenue Last 7 Days
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={restaurant.dailyRevenue} barSize={24}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 10, fill: "#a3a3a3" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: "#a3a3a3" }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={v => `$${v}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "1px solid #f5f5f5", fontSize: "12px" }}
                                        cursor={{ fill: "#f5f5f5" }}
                                    />
                                    <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Restaurant Info */}
                        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                            <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests mb-5">
                                Restaurant Info
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Name",    value: restaurant.name },
                                    { label: "Slug",    value: `/${restaurant.slug}` },
                                    { label: "Address", value: restaurant.address ?? "—" },
                                    { label: "Phone",   value: restaurant.phone ?? "—" },
                                    { label: "Plan",    value: restaurant.plan },
                                    { label: "Created", value: new Date(restaurant.createdAt).toLocaleDateString("en", {
                                        month: "long", day: "numeric", year: "numeric"
                                    })},
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between text-sm border-b border-neutral-50 pb-2">
                                        <span className="text-neutral-400 font-semibold">{label}</span>
                                        <span className="font-bold text-neutral-800">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Staff Tab ── */}
                {activeTab === "staff" && (
                    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-100">
                            <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests">
                                Staff Members ({restaurant.users.length})
                            </h3>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-50 bg-neutral-50">
                                    {["Name", "Email", "Role"].map(h => (
                                        <th key={h} className="text-left text-[11px] font-bold tracking-widests text-neutral-400 uppercase px-5 py-3">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {restaurant.users.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-10 text-neutral-400 text-sm">
                                            No staff members
                                        </td>
                                    </tr>
                                ) : (
                                    restaurant.users.map((user: any) => (
                                        <tr key={user._id} className="border-b border-neutral-50 hover:bg-neutral-50">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center">
                                                        <span className="text-xs font-black text-neutral-600">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-neutral-800">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm text-neutral-500">{user.email}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                                                    ROLE_STYLE[user.role] ?? "bg-neutral-100 text-neutral-500"
                                                )}>
                                                    {user.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Orders Tab ── */}
                {activeTab === "orders" && (
                    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests">
                                Recent Orders
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-neutral-400">
                                    {restaurant.paidOrders} paid / {restaurant.totalOrders} total
                                </span>
                            </div>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-50 bg-neutral-50">
                                    {["Table", "Total", "Status", "Time"].map(h => (
                                        <th key={h} className="text-left text-[11px] font-bold tracking-widests text-neutral-400 uppercase px-5 py-3">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {restaurant.recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-neutral-400 text-sm">
                                            No orders yet
                                        </td>
                                    </tr>
                                ) : (
                                    restaurant.recentOrders.map((order: any) => (
                                        <tr key={order._id} className="border-b border-neutral-50 hover:bg-neutral-50">
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-bold text-neutral-800">
                                                    {order.tableName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm font-black text-indigo-600">
                                                    ${order.total.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                                                    STATUS_STYLE[order.status] ?? "bg-neutral-100 text-neutral-500"
                                                )}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-xs text-neutral-400">
                                                    {timeAgo(order.createdAt)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}