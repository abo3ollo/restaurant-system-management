"use client"

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import {
    DollarSign, ShoppingBag, TrendingUp,
    Download, Calendar,
} from "lucide-react";

type Period = "daily" | "weekly" | "monthly";

// ── CSV Export ──────────────────────────────────────────
function exportToCSV(data: any[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Custom Tooltip ──────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-neutral-100 rounded-xl px-3 py-2 shadow-lg">
            <p className="text-xs font-bold text-neutral-500 mb-1">{label}</p>
            <p className="text-sm font-black text-indigo-600">
                ${payload[0].value.toFixed(2)}
            </p>
        </div>
    );
}

function HourTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-neutral-100 rounded-xl px-3 py-2 shadow-lg">
            <p className="text-xs font-bold text-neutral-500 mb-1">{label}</p>
            <p className="text-sm font-black text-neutral-800">
                {payload[0].value} orders
            </p>
        </div>
    );
}

function AnalyticsReport() {
    const [period, setPeriod] = useState<Period>("daily");
    const data = useQuery(api.orders.getReportsData);

    if (!data) return (
        <div className="flex items-center justify-center h-64 text-neutral-400">
            <p className="text-sm">Loading reports...</p>
        </div>
    );

    const chartData =
        period === "daily" ? data.dailyRevenue :
            period === "weekly" ? data.weeklyRevenue :
                data.monthlyRevenue;

    const maxHourlyCount = Math.max(...data.hourlyOrders.map(h => h.count), 1);

    const SUMMARY = [
        {
            label: "Total Revenue",
            value: `$${data.totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: "bg-indigo-100 text-indigo-600",
        },
        {
            label: "Total Orders",
            value: data.totalOrders,
            icon: ShoppingBag,
            color: "bg-emerald-100 text-emerald-600",
        },
        {
            label: "Paid Orders",
            value: data.paidOrders,
            icon: TrendingUp,
            color: "bg-amber-100 text-amber-600",
        },
        {
            label: "Avg Order Value",
            value: `$${data.avgOrderValue.toFixed(2)}`,
            icon: DollarSign,
            color: "bg-rose-100 text-rose-600",
        },
    ];


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Reports & Analytics</h1>
                    <p className="text-sm text-neutral-400 mt-1">Track your restaurant performance</p>
                </div>
                <button
                    onClick={() => exportToCSV(chartData, `revenue-${period}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                    <Download size={13} />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                {SUMMARY.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", s.color)}>
                                    <Icon size={14} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-neutral-400" />
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">
                            Revenue Overview
                        </h3>
                    </div>
                    {/* Period Toggle */}
                    <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
                        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                                    period === p
                                        ? "bg-white text-neutral-900 shadow-sm"
                                        : "text-neutral-400 hover:text-neutral-600"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} barSize={period === "daily" ? 28 : 40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: "#a3a3a3", fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#a3a3a3", fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={v => `$${v}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
                        <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Top Selling Items */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">
                            Top Selling Items
                        </h3>
                        <button
                            onClick={() => exportToCSV(data.topItems, "top-items")}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                            <Download size={11} />
                            Export
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {data.topItems.length === 0 ? (
                            <p className="text-sm text-neutral-400 text-center py-8">No data yet</p>
                        ) : (
                            data.topItems.map((item, i) => {
                                const maxQty = Math.max(...data.topItems.map(t => t.quantity), 1);
                                return (
                                    <div key={item.name}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-neutral-300 w-5">
                                                    {i + 1}
                                                </span>
                                                <span className="text-sm font-bold text-neutral-700 truncate max-w-40">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-neutral-400">
                                                    {item.quantity} sold
                                                </span>
                                                <span className="text-sm font-black text-indigo-600">
                                                    ${item.revenue.toFixed(0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${(item.quantity / maxQty) * 100}%`,
                                                    background: `hsl(${240 - (i * 20)}, 70%, 60%)`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Busiest Hours Heatmap */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">
                            Busiest Hours
                        </h3>
                        <span className="text-xs text-neutral-400 font-semibold">Orders per hour</span>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="grid grid-cols-6 gap-1.5 mb-4">
                        {data.hourlyOrders.map(({ hour, label, count }) => {
                            const intensity = count / maxHourlyCount;
                            const isActive = count > 0;
                            return (
                                <div
                                    key={hour}
                                    title={`${label}: ${count} orders`}
                                    className="flex flex-col items-center gap-1 group cursor-default"
                                >
                                    <div
                                        className="w-full h-10 rounded-lg transition-all"
                                        style={{
                                            backgroundColor: isActive
                                                ? `rgba(99, 102, 241, ${0.1 + intensity * 0.9})`
                                                : "#f5f5f5",
                                        }}
                                    />
                                    <span className="text-[9px] font-bold text-neutral-400">
                                        {hour % 6 === 0 ? label : ""}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] text-neutral-400 font-semibold">Less</span>
                        {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
                            <div
                                key={o}
                                className="w-6 h-3 rounded"
                                style={{ backgroundColor: `rgba(99, 102, 241, ${o})` }}
                            />
                        ))}
                        <span className="text-[10px] text-neutral-400 font-semibold">More</span>
                    </div>

                    {/* Bar chart version */}
                    <div className="mt-5">
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={data.hourlyOrders.filter(h => h.hour >= 6 && h.hour <= 23)} barSize={8}>
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 9, fill: "#a3a3a3" }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={3}
                                />
                                <Tooltip content={<HourTooltip />} cursor={{ fill: "#f5f5f5" }} />
                                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                                    {data.hourlyOrders
                                        .filter(h => h.hour >= 6 && h.hour <= 23)
                                        .map((entry) => (
                                            <Cell
                                                key={entry.hour}
                                                fill={`rgba(99, 102, 241, ${0.2 + (entry.count / maxHourlyCount) * 0.8})`}
                                            />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnalyticsReport