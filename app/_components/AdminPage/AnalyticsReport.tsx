"use client";

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
import { getCurrencySymbol } from "@/lib/currency";

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
function CustomTooltip({ active, payload, label, currencySymbol }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-neutral-100 rounded-xl px-3 py-2 shadow-lg">
            <p className="text-xs font-bold text-neutral-500 mb-1">{label}</p>
            <p className="text-sm font-black text-indigo-600">
                {currencySymbol}{payload[0].value.toFixed(2)}
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
    const restaurant = useQuery(api.restaurants.getMyRestaurant);
    const currencySymbol = getCurrencySymbol(restaurant?.currency);

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
            value: `${currencySymbol}${data.totalRevenue.toFixed(2)}`,
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
            value: `${currencySymbol}${data.avgOrderValue.toFixed(2)}`,
            icon: DollarSign,
            color: "bg-rose-100 text-rose-600",
        },
        ...(data.taxEnabled && data.taxRate > 0 ? [{
            label: `Tax Collected (${data.taxRate}%)`,
            value: `${currencySymbol}${data.totalTaxCollected.toFixed(2)}`,
            icon: DollarSign,
            color: "bg-purple-100 text-purple-600",
        }] : []),
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-neutral-900">Reports & Analytics</h1>
                    <p className="text-sm text-neutral-400 mt-1">Track your restaurant performance</p>
                </div>
                <button
                    onClick={() => exportToCSV(chartData, `revenue-${period}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                    <Download size={13} />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {SUMMARY.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", s.color)}>
                                    <Icon size={14} />
                                </div>
                            </div>
                            <p className="text-xl md:text-2xl font-black text-neutral-900">{s.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Revenue Chart - Responsive */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-neutral-400" />
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">
                            Revenue Overview
                        </h3>
                    </div>
                    {/* Period Toggle - Responsive */}
                    <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 self-start sm:self-auto">
                        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                                    period === p
                                        ? "bg-white text-neutral-900 shadow-sm"
                                        : "text-neutral-400 hover:text-neutral-600"
                                )}
                            >
                                {p === "daily" ? "Day" : p === "weekly" ? "Week" : "Month"}
                            </button>
                        ))}
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} barSize={period === "daily" ? 20 : 30}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: "#a3a3a3", fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            interval={period === "daily" ? 1 : 0}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#a3a3a3", fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={v => `${currencySymbol}${v}`}
                        />
                        <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} cursor={{ fill: "#f5f5f5" }} />
                        <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Bottom Section - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Top Selling Items */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-6">
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
                            data.topItems.slice(0, 6).map((item, i) => {
                                const maxQty = Math.max(...data.topItems.map(t => t.quantity), 1);
                                return (
                                    <div key={item.name}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-xs font-black text-neutral-300 w-5 flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span className="text-sm font-bold text-neutral-700 truncate">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-2">
                                                <span className="text-xs text-neutral-400 whitespace-nowrap">
                                                    {item.quantity} sold
                                                </span>
                                                <span className="text-sm font-black text-indigo-600 whitespace-nowrap">
                                                    {currencySymbol}{item.revenue.toFixed(0)}
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

                {/* Busiest Hours */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">
                            Busiest Hours
                        </h3>
                        <span className="text-xs text-neutral-400 font-semibold">Orders per hour</span>
                    </div>

                    {/* Heatmap Grid - Responsive */}
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-6 gap-1.5 min-w-[300px] mb-4">
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
                                            className="w-full h-8 md:h-10 rounded-lg transition-all"
                                            style={{
                                                backgroundColor: isActive
                                                    ? `rgba(99, 102, 241, ${0.1 + intensity * 0.9})`
                                                    : "#f5f5f5",
                                            }}
                                        />
                                        <span className="text-[8px] md:text-[9px] font-bold text-neutral-400">
                                            {hour % 6 === 0 ? label : hour % 3 === 0 ? label.slice(0, 2) : ""}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend - Responsive */}
                    <div className="flex items-center justify-center gap-1 md:gap-2 mt-3">
                        <span className="text-[9px] md:text-[10px] text-neutral-400 font-semibold">Less</span>
                        {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
                            <div
                                key={o}
                                className="w-4 h-3 md:w-6 md:h-3 rounded"
                                style={{ backgroundColor: `rgba(99, 102, 241, ${o})` }}
                            />
                        ))}
                        <span className="text-[9px] md:text-[10px] text-neutral-400 font-semibold">More</span>
                    </div>

                    {/* Hourly bar chart - Responsive */}
                    <div className="mt-5 overflow-x-auto">
                        <div className="min-w-[300px]">
                            <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={data.hourlyOrders.filter(h => h.hour >= 6 && h.hour <= 23)} barSize={8}>
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 8, fill: "#a3a3a3" }}
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

            {/* Payment Method Breakdown (if data exists) */}
            {data.paymentMethodBreakdown && data.paymentMethodBreakdown.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-100 p-4 md:p-6">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide mb-4">
                        Payment Method Breakdown
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.paymentMethodBreakdown.map((method: any) => (
                            <div key={method.method} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center",
                                        method.method === "cash" ? "bg-green-100" : "bg-blue-100"
                                    )}>
                                        {method.method === "cash" ? "💵" : "💳"}
                                    </div>
                                    <span className="text-sm font-bold capitalize">{method.method}</span>
                                </div>
                                <span className="text-lg font-black text-indigo-600">
                                    {currencySymbol}{method.amount.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnalyticsReport;