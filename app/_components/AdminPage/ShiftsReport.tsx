"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  Clock,
  DollarSign,
  ShoppingBag,
  User,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Search,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────
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
  const rows = shifts.map((s) => ({
    cashier: s.cashierName,
    date: formatDate(s.startTime),
    start: formatTime(s.startTime),
    end: s.endTime ? formatTime(s.endTime) : "Active",
    duration: formatDuration(s.startTime, s.endTime),
    orders: s.totalOrders ?? 0,
    revenue: s.totalRevenue?.toFixed(2) ?? "0.00",
    opening_balance: s.openingBalance?.toFixed(2) ?? "0.00",
    closing_balance: s.closingBalance?.toFixed(2) ?? "—",
    expected_balance: s.expectedBalance?.toFixed(2) ?? "—",
    difference: s.difference?.toFixed(2) ?? "—",
    cash_sales: s.cashSalesTotal?.toFixed(2) ?? "0.00",
    status: s.status,
  }));
  const headers = Object.keys(rows[0]).join(",");
  const csv = rows.map((r) => Object.values(r).join(",")).join("\n");
  const blob = new Blob([`${headers}\n${csv}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shifts-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type FilterStatus = "all" | "open" | "closed";

export default function ShiftsReport() {
  const shifts = useQuery(api.shifts.getAllShifts);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!shifts)
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        <p className="text-sm">Loading shifts...</p>
      </div>
    );

  // ── Stats ──────────────────────────────────────────
  const totalRevenue = shifts
    .filter((s) => s.status === "closed")
    .reduce((sum, s) => sum + (s.totalRevenue ?? 0), 0);

  const totalOrders = shifts
    .filter((s) => s.status === "closed")
    .reduce((sum, s) => sum + (s.totalOrders ?? 0), 0);

  const activeShifts = shifts.filter((s) => s.status === "open").length;
  const closedShifts = shifts.filter((s) => s.status === "closed").length;

  const totalShortage = shifts
    .filter((s) => s.status === "closed" && (s.difference ?? 0) < 0)
    .reduce((sum, s) => sum + Math.abs(s.difference ?? 0), 0);

  // ── Filter ─────────────────────────────────────────
  const filtered = shifts
    .filter((s) => filterStatus === "all" || s.status === filterStatus)
    .filter((s) => s.cashierName.toLowerCase().includes(search.toLowerCase()));

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">
            Shifts Report
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            All cashier shifts and cash drawer performance
          </p>
        </div>
        <button
          onClick={() => exportToCSV(shifts)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">
              Total Shifts
            </p>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Clock size={14} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900">
            {shifts.length}
          </p>
          <p className="text-xs text-neutral-400 mt-1">{closedShifts} closed</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">
              Active Now
            </p>
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
              <User size={14} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600">{activeShifts}</p>
          <p className="text-xs text-neutral-400 mt-1">cashiers online</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">
              Total Orders
            </p>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <ShoppingBag size={14} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900">{totalOrders}</p>
          <p className="text-xs text-neutral-400 mt-1">across all shifts</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">
              Total Revenue
            </p>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign size={14} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            ${totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">paid orders only</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">
              Total Shortage
            </p>
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={14} className="text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-500">
            {totalShortage > 0 ? `-$${totalShortage.toFixed(2)}` : "$0.00"}
          </p>
          <p className="text-xs text-neutral-400 mt-1">cash discrepancies</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by cashier..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
          {(["all", "open", "closed"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                filterStatus === f
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-600",
              )}
            >
              {f === "all"
                ? `All (${shifts.length})`
                : f === "open"
                  ? `Active (${activeShifts})`
                  : `Closed (${closedShifts})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Shifts Table ── */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {[
                "",
                "Cashier",
                "Date",
                "Time",
                "Duration",
                "Orders",
                "Revenue",
                "Difference",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-bold tracking-widests text-neutral-400 uppercase px-4 py-3.5"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-16 text-neutral-400 text-sm"
                >
                  No shifts found
                </td>
              </tr>
            ) : (
              filtered.map((shift) => {
                const diff = shift.difference ?? 0;
                const isExpanded = expandedId === shift._id;

                return (
                  <React.Fragment key={shift._id}>
                    <tr
                      key={shift._id}
                      onClick={() =>
                        shift.status === "closed" && toggleExpand(shift._id)
                      }
                      className={cn(
                        "border-b border-neutral-50 transition-colors",
                        shift.status === "closed"
                          ? "cursor-pointer hover:bg-neutral-50"
                          : "",
                        isExpanded ? "bg-indigo-50/50" : "",
                      )}
                    >
                      {/* Expand icon */}
                      <td className="px-4 py-4 w-8">
                        {shift.status === "closed" && (
                          <div className="text-neutral-300 hover:text-neutral-500">
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </div>
                        )}
                      </td>

                      {/* Cashier */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
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
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-600">
                          {formatDate(shift.startTime)}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-600">
                          {formatTime(shift.startTime)}
                          {shift.endTime && ` → ${formatTime(shift.endTime)}`}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-600">
                          {formatDuration(shift.startTime, shift.endTime)}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-neutral-800">
                          {shift.totalOrders ?? (
                            <span className="text-neutral-300">—</span>
                          )}
                        </span>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-4">
                        <span className="text-sm font-black text-indigo-600">
                          {shift.totalRevenue !== undefined ? (
                            `$${shift.totalRevenue.toFixed(2)}`
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </span>
                      </td>

                      {/* Difference */}
                      <td className="px-4 py-4">
                        {shift.status === "closed" &&
                        shift.difference !== undefined ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg",
                              diff < 0
                                ? "bg-red-50 text-red-600"
                                : diff > 0
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-green-50 text-green-600",
                            )}
                          >
                            {diff < 0 ? (
                              <AlertTriangle size={10} />
                            ) : diff > 0 ? (
                              <TrendingUp size={10} />
                            ) : (
                              <CheckCircle2 size={10} />
                            )}
                            {diff < 0
                              ? `-$${Math.abs(diff).toFixed(2)}`
                              : diff > 0
                                ? `+$${diff.toFixed(2)}`
                                : "Exact"}
                          </span>
                        ) : (
                          <span className="text-neutral-300 text-sm">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold",
                            shift.status === "open"
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-100 text-neutral-500",
                          )}
                        >
                          {shift.status === "open" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          )}
                          {shift.status === "open" ? "Active" : "Closed"}
                        </span>
                      </td>
                    </tr>

                    {/* ── Expanded Row ── */}
                    {isExpanded && (
                      <tr
                        key={`${shift._id}-expanded`}
                        className="bg-indigo-50/30"
                      >
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-4 gap-4">
                            {/* Cash Drawer */}
                            <div className="bg-white rounded-2xl border border-neutral-100 p-4">
                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widests mb-3">
                                Cash Drawer
                              </p>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">
                                    Opening
                                  </span>
                                  <span className="font-bold">
                                    ${(shift.openingBalance ?? 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">
                                    Cash Sales
                                  </span>
                                  <span className="font-bold text-green-600">
                                    +${(shift.cashSalesTotal ?? 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-neutral-100 pt-2">
                                  <span className="text-neutral-500">
                                    Expected
                                  </span>
                                  <span className="font-black">
                                    ${(shift.expectedBalance ?? 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">
                                    Actual
                                  </span>
                                  <span className="font-black">
                                    ${(shift.closingBalance ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Performance */}
                            <div className="bg-white rounded-2xl border border-neutral-100 p-4">
                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widests mb-3">
                                Performance
                              </p>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">
                                    Total Orders
                                  </span>
                                  <span className="font-bold">
                                    {shift.totalOrders ?? 0}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-neutral-500">
                                    Total Revenue
                                  </span>
                                  <span className="font-bold text-indigo-600">
                                    ${(shift.totalRevenue ?? 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs border-t border-neutral-100 pt-2">
                                  <span className="text-neutral-500">
                                    Duration
                                  </span>
                                  <span className="font-black">
                                    {formatDuration(
                                      shift.startTime,
                                      shift.endTime,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Difference */}
                            <div
                              className={cn(
                                "rounded-2xl border p-4",
                                diff < 0
                                  ? "bg-red-50 border-red-100"
                                  : diff > 0
                                    ? "bg-amber-50 border-amber-100"
                                    : "bg-green-50 border-green-100",
                              )}
                            >
                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widests mb-3">
                                Cash Difference
                              </p>
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center",
                                    diff < 0
                                      ? "bg-red-100"
                                      : diff > 0
                                        ? "bg-amber-100"
                                        : "bg-green-100",
                                  )}
                                >
                                  {diff < 0 ? (
                                    <AlertTriangle
                                      size={14}
                                      className="text-red-500"
                                    />
                                  ) : diff > 0 ? (
                                    <TrendingUp
                                      size={14}
                                      className="text-amber-500"
                                    />
                                  ) : (
                                    <CheckCircle2
                                      size={14}
                                      className="text-green-500"
                                    />
                                  )}
                                </div>
                                <div>
                                  <p
                                    className={cn(
                                      "text-lg font-black",
                                      diff < 0
                                        ? "text-red-600"
                                        : diff > 0
                                          ? "text-amber-600"
                                          : "text-green-600",
                                    )}
                                  >
                                    {diff < 0
                                      ? `-$${Math.abs(diff).toFixed(2)}`
                                      : diff > 0
                                        ? `+$${diff.toFixed(2)}`
                                        : "Balanced"}
                                  </p>
                                  <p className="text-[10px] text-neutral-400 font-semibold">
                                    {diff < 0
                                      ? "Shortage"
                                      : diff > 0
                                        ? "Overage"
                                        : "Exact match"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-2xl border border-neutral-100 p-4">
                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widests mb-3">
                                Notes
                              </p>
                              <p className="text-xs text-neutral-500 italic">
                                {shift.notes ?? "No notes for this shift"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
