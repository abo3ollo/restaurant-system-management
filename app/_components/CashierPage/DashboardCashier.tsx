"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingBag, DollarSign, Clock, TrendingUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  currentUser: any;
  onCloseShift: () => void;
};

export default function CashierDashboard({ currentUser, onCloseShift }: Props) {
  const currentShift = useQuery(api.shifts.getCurrentShift);
  const allOrders = useQuery(api.orders.getOrders);

  // Orders during this shift only
  const shiftOrders =
    allOrders?.filter(
      (o) =>
        currentShift &&
        o.createdAt >= currentShift.startTime &&
        o.userId === currentShift.cashierId,
    ) ?? [];

  const paidOrders = shiftOrders.filter((o) => o.status === "paid");
  const activeOrders = shiftOrders.filter((o) => o.status !== "paid");
  const shiftRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  const shiftDuration = currentShift
    ? Math.floor((Date.now() - currentShift.startTime) / 60000)
    : 0;

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {currentShift
              ? `Shift started at ${formatTime(currentShift.startTime)}`
              : "No active shift"}
          </p>
        </div>
        <button
          onClick={onCloseShift}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors shadow-lg shadow-red-100"
        >
          <Lock size={15} />
          Close Shift
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
              Total Orders
            </p>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <ShoppingBag size={14} className="text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-neutral-900">
            {shiftOrders.length}
          </p>
          <p className="text-xs text-neutral-400 mt-1">This shift</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">
              Active Orders
            </p>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp size={14} className="text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-neutral-900">
            {activeOrders.length}
          </p>
          <p className="text-xs text-neutral-400 mt-1">In progress</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widests text-neutral-400 uppercase">
              Revenue
            </p>
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign size={14} className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-green-600">
            ${shiftRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Paid orders only</p>
        </div>
      </div>

      {/* ── Shift Info ── */}
      {currentShift && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-neutral-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                Shift Duration
              </p>
              <p className="text-lg font-black text-neutral-900 mt-0.5">
                {formatDuration(shiftDuration)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400 font-semibold">
                Opening Balance
              </p>
              <p className="text-sm font-black text-neutral-800">
                ${(currentShift.openingBalance ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-700">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Orders ── */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide mb-4">
          Recent Orders
        </h3>

        {shiftOrders.length === 0 ? (
          <div className="text-center py-10 text-neutral-300">
            <ShoppingBag size={32} className="mx-auto mb-2" />
            <p className="text-sm font-semibold">No orders yet this shift</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {shiftOrders
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-3 border-b border-neutral-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-bold text-neutral-800">
                      {order.tableName}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(order.createdAt).toLocaleTimeString("en", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                        order.status === "paid"
                          ? "bg-neutral-100 text-neutral-500"
                          : order.status === "served"
                            ? "bg-green-100 text-green-700"
                            : order.status === "preparing"
                              ? "bg-orange-100 text-orange-700"
                              : order.status === "confirmed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-black text-amber-600 w-16 text-right">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Shift totals summary */}
        {shiftOrders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Shift Total
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-400">
                {paidOrders.length} paid · {activeOrders.length} active
              </span>
              <span className="text-base font-black text-green-600">
                ${shiftRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
