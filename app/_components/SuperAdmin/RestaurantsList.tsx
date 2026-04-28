"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Store, Users, DollarSign, Search,
    ChevronRight, Pause, Play, Trash2, Loader2,
} from "lucide-react";

export default function RestaurantsList() {
    const router = useRouter();
    const restaurants = useQuery(api.restaurants.getAll);
    const updateRestaurant = useMutation(api.restaurants.updateRestaurant);
    const deleteRestaurant = useMutation(api.restaurants.deleteRestaurant);

    const [search, setSearch] = useState("");
    const [filterPlan, setFilterPlan] = useState<"all" | "free" | "pro" | "enterprise">("all");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "suspended">("all");
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const filtered = restaurants
        ?.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) ||
                      r.slug.toLowerCase().includes(search.toLowerCase()))
        ?.filter(r => filterPlan === "all" || r.plan === filterPlan)
        ?.filter(r => filterStatus === "all" || r.status === filterStatus)
        ?? [];

    const handleToggleStatus = async (id: Id<"restaurants">, current: string) => {
        setLoadingId(id);
        try {
            await updateRestaurant({
                id,
                status: current === "active" ? "suspended" : "active",
            });
            toast.success(current === "active" ? "Restaurant suspended" : "Restaurant activated");
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (id: Id<"restaurants">, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setLoadingId(id);
        try {
            await deleteRestaurant({ id });
            toast.success("Restaurant deleted");
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">All Restaurants</h1>
                    <p className="text-sm text-neutral-400 mt-1">
                        {restaurants?.length ?? 0} restaurants on the platform
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or slug..."
                        className="w-full pl-8 pr-4 py-2 text-sm border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                    />
                </div>

                {/* Plan filter */}
                <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
                    {(["all", "free", "pro", "enterprise"] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setFilterPlan(p)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                                filterPlan === p
                                    ? "bg-white text-neutral-900 shadow-sm"
                                    : "text-neutral-400 hover:text-neutral-600"
                            )}
                        >{p}</button>
                    ))}
                </div>

                {/* Status filter */}
                <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
                    {(["all", "active", "suspended"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                                filterStatus === s
                                    ? "bg-white text-neutral-900 shadow-sm"
                                    : "text-neutral-400 hover:text-neutral-600"
                            )}
                        >{s}</button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {!restaurants ? (
                <div className="flex items-center justify-center h-32 text-neutral-400">
                    <Loader2 size={20} className="animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center">
                    <Store size={32} className="text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-neutral-400">No restaurants found</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {filtered.map(r => (
                        <div
                            key={r._id}
                            className="bg-white rounded-2xl border border-neutral-100 p-5 hover:border-neutral-200 hover:shadow-sm transition-all"
                        >
                            {/* Top row */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                        <span className="text-sm font-black text-indigo-600">
                                            {r.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-neutral-900">{r.name}</p>
                                        <p className="text-xs text-neutral-400">/{r.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                                        r.plan === "pro" ? "bg-indigo-100 text-indigo-700" :
                                        r.plan === "enterprise" ? "bg-purple-100 text-purple-700" :
                                        "bg-neutral-100 text-neutral-500"
                                    )}>
                                        {r.plan}
                                    </span>
                                    <span className={cn(
                                        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg",
                                        r.status === "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-600"
                                    )}>
                                        {r.status === "active" && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        )}
                                        {r.status}
                                    </span>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-neutral-50 rounded-xl p-3 text-center">
                                    <Users size={12} className="text-neutral-400 mx-auto mb-1" />
                                    <p className="text-base font-black text-neutral-900">{r.userCount}</p>
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase">Staff</p>
                                </div>
                                <div className="bg-neutral-50 rounded-xl p-3 text-center">
                                    <Store size={12} className="text-neutral-400 mx-auto mb-1" />
                                    <p className="text-base font-black text-neutral-900">{r.orderCount}</p>
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase">Orders</p>
                                </div>
                                <div className="bg-neutral-50 rounded-xl p-3 text-center">
                                    <DollarSign size={12} className="text-neutral-400 mx-auto mb-1" />
                                    <p className="text-base font-black text-indigo-600">${r.revenue.toFixed(0)}</p>
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase">Revenue</p>
                                </div>
                            </div>

                            {/* Created date */}
                            <p className="text-[10px] text-neutral-400 mb-4">
                                Created {new Date(r.createdAt).toLocaleDateString("en", {
                                    month: "short", day: "numeric", year: "numeric"
                                })}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {/* View Details */}
                                <button
                                    onClick={() => router.push(`/super-admin/restaurants/${r._id}`)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-colors"
                                >
                                    View Details <ChevronRight size={12} />
                                </button>

                                {/* Suspend / Activate */}
                                <button
                                    onClick={() => handleToggleStatus(r._id, r.status)}
                                    disabled={loadingId === r._id}
                                    className={cn(
                                        "px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50",
                                        r.status === "active"
                                            ? "bg-amber-50 hover:bg-amber-100 text-amber-600"
                                            : "bg-green-50 hover:bg-green-100 text-green-600"
                                    )}
                                >
                                    {loadingId === r._id ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : r.status === "active" ? (
                                        <Pause size={12} />
                                    ) : (
                                        <Play size={12} />
                                    )}
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(r._id, r.name)}
                                    disabled={loadingId === r._id}
                                    className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}