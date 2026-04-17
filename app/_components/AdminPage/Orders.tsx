// app/_components/AdminPage/Orders.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, ChefHat, Utensils, CreditCard } from "lucide-react";

// In Orders.tsx STATUS_CONFIG — add role hints
const STATUS_CONFIG = {
    pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700", icon: Clock,        hint: "Awaiting cashier confirmation" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700",     icon: CheckCircle,  hint: "Kitchen preparing" },
    preparing: { label: "Preparing", color: "bg-orange-100 text-orange-700", icon: ChefHat,      hint: "Waiter to serve" },
    served:    { label: "Served",    color: "bg-green-100 text-green-700",   icon: Utensils,     hint: "Cashier to collect payment" },
    paid:      { label: "Paid",      color: "bg-neutral-100 text-neutral-500", icon: CheckCircle, hint: "Completed" },
};

const STATUS_FLOW = ["pending", "confirmed", "preparing", "served", "paid"] as const;

export default function Orders() {
    const orders = useQuery(api.orders.getOrders);
    const updateStatus = useMutation(api.orders.updateOrderStatus);

    const getNextStatus = (current: string) => {
        const idx = STATUS_FLOW.indexOf(current as any);
        return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
    };

    if (!orders) return (
        <div className="flex items-center justify-center h-64 text-neutral-400">
            <p className="text-sm">Loading orders...</p>
        </div>
    );

    if (orders.length === 0) return (
        <div className="flex items-center justify-center h-64 text-neutral-400">
            <p className="text-sm">No orders yet</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-neutral-900">Orders</h1>
                <p className="text-sm text-neutral-400 mt-1">
                    {orders.length} total orders
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
                {STATUS_FLOW.map((status) => {
                    const count = orders.filter(o => o.status === status).length;
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    return (
                        <div key={status} className="bg-white rounded-2xl border border-neutral-100 p-4 flex flex-col gap-2">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", config.color)}>
                                <Icon size={14} />
                            </div>
                            <p className="text-2xl font-black text-neutral-900">{count}</p>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                                {config.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-neutral-100">
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Order</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Table</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Items</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Total</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Status</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Time</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, idx) => {
                            const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                            const Icon = config.icon;
                            const nextStatus = getNextStatus(order.status);
                            const timeAgo = Math.floor((Date.now() - order.createdAt) / 60000);

                            return (
                                <tr key={order._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                                    {/* Order # */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-neutral-800">
                                            #{String(idx + 1).padStart(4, "0")}
                                        </span>
                                    </td>

                                    {/* Table */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-neutral-700">
                                            {order.tableName}
                                        </span>
                                    </td>

                                    {/* Items */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            {order.items.map((item) => (
                                                <p key={item._id} className="text-xs text-neutral-500">
                                                    {item.quantity}x {item.menuItemName}
                                                    {item.notes && (
                                                        <span className="text-neutral-400 ml-1 italic">
                                                            ({item.notes})
                                                        </span>
                                                    )}
                                                </p>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Total */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-indigo-600">
                                            ${order.total.toFixed(2)}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold",
                                            config.color
                                        )}>
                                            <Icon size={11} />
                                            {config.label}
                                        </span>
                                    </td>

                                    {/* Time */}
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-neutral-400">
                                            {timeAgo === 0 ? "Just now" : `${timeAgo}m ago`}
                                        </span>
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-4">
                                        {nextStatus && (
                                            <button
                                                onClick={() => updateStatus({
                                                    orderId: order._id as Id<"orders">,
                                                    status: nextStatus,
                                                })}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                → Mark {STATUS_CONFIG[nextStatus].label}
                                            </button>
                                        )}
                                        {!nextStatus && (
                                            <span className="text-xs text-neutral-300 font-semibold">
                                                Completed
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}