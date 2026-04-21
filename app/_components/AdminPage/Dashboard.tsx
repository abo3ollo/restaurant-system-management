"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
    TrendingUp, TrendingDown, DollarSign,
    ShoppingBag, Star, ArrowUpRight, ChevronRight,
} from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    preparing: "bg-amber-100 text-amber-700",
    served:    "bg-emerald-100 text-emerald-700",
    paid:      "bg-neutral-100 text-neutral-500",
};

const COLOR: Record<string, string> = {
    indigo:  "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber:   "bg-amber-100 text-amber-600",
    rose:    "bg-rose-100 text-rose-600",
};

function timeAgo(timestamp: number) {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff === 0) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

export default function Dashboard() {
    const stats = useQuery(api.orders.getDashboardStats);

    if (!stats) return (
        <div className="flex items-center justify-center h-64 text-neutral-400">
            <p className="text-sm">Loading dashboard...</p>
        </div>
    );

    const STATS = [
        {
            label: "Today's Revenue",
            value: `$${stats.todayRevenue.toFixed(2)}`,
            change: `${stats.revenueChange > 0 ? "+" : ""}${stats.revenueChange}%`,
            up: stats.revenueChange >= 0,
            icon: DollarSign,
            color: "indigo",
        },
        {
            label: "Total Orders",
            value: `${stats.todayOrderCount}`,
            change: `${stats.ordersChange > 0 ? "+" : ""}${stats.ordersChange}%`,
            up: stats.ordersChange >= 0,
            icon: ShoppingBag,
            color: "emerald",
        },
        {
            label: "Avg. Order Value",
            value: `$${stats.avgOrderValue.toFixed(1)}`,
            change: `${stats.avgChange > 0 ? "+" : ""}${stats.avgChange}%`,
            up: stats.avgChange >= 0,
            icon: TrendingUp,
            color: "amber",
        },
        {
            label: "Customer Rating",
            value: "4.8",
            change: "+0.2",
            up: true,
            icon: Star,
            color: "rose",
        },
    ];

    const maxRevenue = Math.max(...stats.topItems.map(i => i.revenue), 1);

    return (
        <>
            {/* ── STATS ── */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {STATS.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", COLOR[s.color])}>
                                    <Icon size={14} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                            <div className={cn("flex items-center gap-1 mt-1", s.up ? "text-emerald-600" : "text-red-500")}>
                                {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                <span className="text-xs font-bold">{s.change} vs yesterday</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* ── RECENT ORDERS ── */}
                <div className="col-span-2 bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">
                            Recent Orders
                        </h3>
                        <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                            View all <ChevronRight size={12} />
                        </button>
                    </div>

                    {stats.recentOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-neutral-300">
                            <p className="text-sm">No orders yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {stats.recentOrders.map((o, idx) => (
                                <div
                                    key={o._id}
                                    className="flex items-center gap-4 py-2.5 border-b border-neutral-50 last:border-0"
                                >
                                    <span className="text-xs font-black text-neutral-400 w-12">
                                        #{String(idx + 1).padStart(4, "0")}
                                    </span>
                                    <span className="text-sm font-bold text-neutral-700 flex-1">
                                        {o.tableName}
                                    </span>
                                    <span className="text-xs text-neutral-400">
                                        {o.itemCount} items
                                    </span>
                                    <span className="text-sm font-black text-neutral-800 w-16 text-right">
                                        ${o.total.toFixed(2)}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg uppercase",
                                        STATUS_STYLE[o.status] ?? "bg-neutral-100 text-neutral-500"
                                    )}>
                                        {o.status}
                                    </span>
                                    <span className="text-[11px] text-neutral-400 w-14 text-right">
                                        {timeAgo(o.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                    {/* Top Items */}
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide mb-5">
                        Top Items
                    </h3>

                    {stats.topItems.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-neutral-300">
                            <p className="text-xs">No data yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {stats.topItems.map((item, i) => (
                                <div key={item.name}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-neutral-300 w-4">
                                                {i + 1}
                                            </span>
                                            <span className="text-xs font-bold text-neutral-700 truncate max-w-32">
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-neutral-800">
                                            ${item.revenue.toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-400 rounded-full transition-all"
                                            style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-400 mt-1">
                                        {item.orders} orders
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="mt-6 pt-5 border-t border-neutral-100">
                        <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">
                            Quick Actions
                        </p>
                        {[
                            { label: "Add Menu Item", nav: "Menu" },
                            { label: "Manage Tables", nav: "Tables" },
                            { label: "Export Report", nav: "Reports" },
                        ].map(({ label }) => (
                            <button
                                key={label}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-xs font-bold text-neutral-600 hover:text-indigo-700 transition-all mb-1"
                            >
                                {label} <ArrowUpRight size={12} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}