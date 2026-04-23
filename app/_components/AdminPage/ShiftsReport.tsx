"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Clock, DollarSign, ShoppingBag, User, Download } from "lucide-react";

function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("en", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDuration(start: number, end?: number) {
    const diff = Math.floor(((end ?? Date.now()) - start) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function exportToCSV(shifts: any[]) {
    if (!shifts.length) return;
    const rows = shifts.map(s => ({
        cashier: s.cashierName,
        date: formatDate(s.startTime),
        start: formatTime(s.startTime),
        end: s.endTime ? formatTime(s.endTime) : "Active",
        duration: formatDuration(s.startTime, s.endTime),
        orders: s.totalOrders ?? 0,
        revenue: s.totalRevenue?.toFixed(2) ?? "0.00",
        status: s.status,
    }));
    const headers = Object.keys(rows[0]).join(",");
    const csv = rows.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${csv}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shifts-report.csv";
    a.click();
    URL.revokeObjectURL(url);
}

export default function ShiftsReport() {
    const shifts = useQuery(api.shifts.getAllShifts);

    if (!shifts) return (
        <div className="flex items-center justify-center h-64 text-neutral-400">
            <p className="text-sm">Loading shifts...</p>
        </div>
    );

    // Summary stats
    const totalRevenue = shifts
        .filter(s => s.status === "closed")
        .reduce((sum, s) => sum + (s.totalRevenue ?? 0), 0);

    const totalOrders = shifts
        .filter(s => s.status === "closed")
        .reduce((sum, s) => sum + (s.totalOrders ?? 0), 0);

    const activeShifts = shifts.filter(s => s.status === "open").length;
    const closedShifts = shifts.filter(s => s.status === "closed").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900">Shifts Report</h1>
                    <p className="text-sm text-neutral-400 mt-1">
                        All cashier shifts and performance
                    </p>
                </div>
                <button
                    onClick={() => exportToCSV(shifts)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                    <Download size={13} />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                            Total Shifts
                        </p>
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Clock size={14} className="text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900">{shifts.length}</p>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                            Active Now
                        </p>
                        <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                            <User size={14} className="text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-green-600">{activeShifts}</p>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                            Total Orders
                        </p>
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                            <ShoppingBag size={14} className="text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-neutral-900">{totalOrders}</p>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                            Total Revenue
                        </p>
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <DollarSign size={14} className="text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">
                        ${totalRevenue.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Shifts Table */}
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-100">
                            {["Cashier", "Date", "Start", "End", "Duration", "Orders", "Revenue", "Status"].map(h => (
                                <th
                                    key={h}
                                    className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-5 py-4"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-16 text-neutral-400 text-sm">
                                    No shifts recorded yet
                                </td>
                            </tr>
                        ) : (
                            shifts.map((shift) => (
                                <tr
                                    key={shift._id}
                                    className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                                >
                                    {/* Cashier */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <span className="text-xs font-black text-indigo-600">
                                                    {shift.cashierName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-neutral-800">
                                                {shift.cashierName}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Date */}
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-neutral-600">
                                            {formatDate(shift.startTime)}
                                        </span>
                                    </td>

                                    {/* Start */}
                                    <td className="px-5 py-4">
                                        <span className="text-sm font-semibold text-neutral-700">
                                            {formatTime(shift.startTime)}
                                        </span>
                                    </td>

                                    {/* End */}
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-neutral-600">
                                            {shift.endTime ? formatTime(shift.endTime) : (
                                                <span className="text-green-600 font-bold">Active</span>
                                            )}
                                        </span>
                                    </td>

                                    {/* Duration */}
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-neutral-600">
                                            {formatDuration(shift.startTime, shift.endTime)}
                                        </span>
                                    </td>

                                    {/* Orders */}
                                    <td className="px-5 py-4">
                                        <span className="text-sm font-bold text-neutral-800">
                                            {shift.totalOrders ?? (
                                                <span className="text-neutral-400">—</span>
                                            )}
                                        </span>
                                    </td>

                                    {/* Revenue */}
                                    <td className="px-5 py-4">
                                        <span className="text-sm font-black text-indigo-600">
                                            {shift.totalRevenue !== undefined
                                                ? `$${shift.totalRevenue.toFixed(2)}`
                                                : <span className="text-neutral-400">—</span>
                                            }
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold",
                                            shift.status === "open"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-neutral-100 text-neutral-500"
                                        )}>
                                            {shift.status === "open" && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            )}
                                            {shift.status === "open" ? "Active" : "Closed"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}