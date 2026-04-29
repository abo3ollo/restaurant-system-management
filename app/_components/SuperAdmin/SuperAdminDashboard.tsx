"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
    Store, Users, DollarSign, TrendingUp,
    CheckCircle, AlertTriangle,
} from "lucide-react";

export default function SuperAdminDashboard() {
    const restaurants = useQuery(api.restaurants.getAll);
    console.log(restaurants);
    

    if (!restaurants) return (
        <div className="flex items-center justify-center h-64 text-neutral-400">
            <p className="text-sm">Loading...</p>
        </div>
    );

    const totalRestaurants = restaurants.length;
    const activeRestaurants = restaurants.filter(r => r.status === "active").length;
    const suspendedRestaurants = restaurants.filter(r => r.status === "suspended").length;
    const totalUsers = restaurants.reduce((sum, r) => sum + r.userCount, 0);
    const totalRevenue = restaurants.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = restaurants.reduce((sum, r) => sum + r.orderCount, 0);

    const STATS = [
        {
            label: "Total Restaurants",
            value: totalRestaurants,
            icon: Store,
            color: "bg-indigo-100 text-indigo-600",
            sub: `${activeRestaurants} active`,
        },
        {
            label: "Total Users",
            value: totalUsers,
            icon: Users,
            color: "bg-amber-100 text-amber-600",
            sub: "across all restaurants",
        },
        {
            label: "Total Revenue",
            value: `$${totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: "bg-emerald-100 text-emerald-600",
            sub: "all time",
        },
        {
            label: "Total Orders",
            value: totalOrders,
            icon: TrendingUp,
            color: "bg-blue-100 text-blue-600",
            sub: "all time",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-neutral-900">Platform Overview</h1>
                <p className="text-sm text-neutral-400 mt-1">All restaurants on Foodics POS</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {STATS.map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", s.color)}>
                                    <Icon size={14} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                            <p className="text-xs text-neutral-400 mt-1">{s.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                        <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-green-600">{activeRestaurants}</p>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">Active Restaurants</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-red-500">{suspendedRestaurants}</p>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">Suspended</p>
                    </div>
                </div>
            </div>

            {/* Recent restaurants */}
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widests">
                        Recent Restaurants
                    </h3>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-50 bg-neutral-50">
                            {["Restaurant", "Plan", "Users", "Orders", "Revenue", "Status"].map(h => (
                                <th key={h} className="text-left text-[11px] font-bold tracking-widests text-neutral-400 uppercase px-5 py-3">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {restaurants.slice(0, 5).map(r => (
                            <tr key={r._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                                            <span className="text-xs font-black text-indigo-600">
                                                {r.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-neutral-800">{r.name}</p>
                                            <p className="text-[10px] text-neutral-400">{r.slug}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                                        r.plan === "pro" ? "bg-indigo-100 text-indigo-700" :
                                        r.plan === "enterprise" ? "bg-purple-100 text-purple-700" :
                                        "bg-neutral-100 text-neutral-500"
                                    )}>
                                        {r.plan}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className="text-sm font-bold text-neutral-700">{r.userCount}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className="text-sm font-bold text-neutral-700">{r.orderCount}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className="text-sm font-black text-indigo-600">${r.revenue.toFixed(2)}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg",
                                        r.status === "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-600"
                                    )}>
                                        {r.status === "active" && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        )}
                                        {r.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}