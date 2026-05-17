"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, ChefHat, Utensils, CreditCard } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currency";

// In Orders.tsx STATUS_CONFIG — add role hints
const STATUS_CONFIG = {
    pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700", icon: Clock,        hint: "Awaiting cashier confirmation" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700",     icon: CheckCircle,  hint: "Kitchen preparing" },
    preparing: { label: "Preparing", color: "bg-orange-100 text-orange-700", icon: ChefHat,      hint: "Waiter to serve" },
    served:    { label: "Served",    color: "bg-green-100 text-green-700",   icon: Utensils,     hint: "Cashier to collect payment" },
    paid:      { label: "Paid",      color: "bg-neutral-100 text-neutral-500", icon: CheckCircle, hint: "Completed" },
};

const STATUS_FLOW = ["pending", "confirmed", "preparing", "served", "paid"] as const;

// Format time function
function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears >= 1) {
        return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    }
    if (diffInMonths >= 1) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    if (diffInWeeks >= 1) {
        return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }
    if (diffInDays >= 1) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    if (diffInHours >= 1) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    if (diffInMinutes >= 1) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    return "Just now";
}

export default function Orders() {
    const orders = useQuery(api.orders.getOrders);
    const restaurant = useQuery(api.restaurants.getMyRestaurant);
    
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

    // FIX: Sort orders by creation date - NEWEST FIRST (descending order)
    const sortedOrders = [...orders].sort((a, b) => {
        return new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime();
    });

    // For reverse lookup when showing order numbers (oldest = #0001)
    const oldestFirstOrders = [...orders].sort((a, b) => {
        return new Date(a._creationTime).getTime() - new Date(b._creationTime).getTime();
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-neutral-900">Orders</h1>
                <p className="text-sm text-neutral-400 mt-1">
                    {sortedOrders.length} total orders
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATUS_FLOW.map((status) => {
                    const count = sortedOrders.filter(o => o.status === status).length;
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
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-250 lg:min-w-full">
                    <thead>
                        <tr className="border-b border-neutral-100">
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Order</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Table</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Items</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Cashier</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Total</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Payment Method</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Status</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Time</th>
                            <th className="text-left text-[11px] font-bold tracking-widest text-neutral-400 uppercase px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedOrders.map((order) => {
                            const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                            const Icon = config.icon;
                            const nextStatus = getNextStatus(order.status);
                            const timeAgo = formatTimeAgo(order.createdAt);
                            
                            // Get the correct order number based on creation time (oldest = #0001)
                            const orderNumber = oldestFirstOrders.findIndex(o => o._id === order._id) + 1;

                            return (
                                <tr key={order._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                                    {/* Order # - Shows sequential number based on creation order */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-neutral-800">
                                            #{String(orderNumber).padStart(4, "0")}
                                        </span>
                                    </td>

                                    {/* Table */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-neutral-700">
                                            {order.orderType === "takeaway" ? "🥡 Takeaway" : 
                                             order.orderType === "delivery" ? "🛵 Delivery" : 
                                             order.tableName}
                                        </span>
                                    </td>

                                    {/* Items */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            {order.items.map((item: any, itemIdx: number) => (
                                                <p key={itemIdx} className="text-xs text-neutral-500">
                                                    {item.quantity}x {item.menuItemName}
                                                    {item.note && (
                                                        <span className="text-neutral-400 ml-1 italic">
                                                            ({item.note})
                                                        </span>
                                                    )}
                                                </p>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Cashier */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-neutral-500">
                                            {order.cashierName}
                                        </span>
                                    </td>

                                    {/* Total */}
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-indigo-600">
                                            {getCurrencySymbol(restaurant?.currency)}{(() => {
                                                const taxRate = restaurant?.taxEnabled ? (restaurant?.taxRate ?? 0) : 0;
                                                const tax = +(order.total * (taxRate / 100)).toFixed(2);
                                                const discount = restaurant?.discountEnabled ? (restaurant?.discountAmount ?? 0) : 0;
                                                return (order.total + tax - discount).toFixed(2);
                                            })()}
                                        </span>
                                    </td>

                                    {/* Payment Method */}
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 text-sm font-bold text-neutral-500">
                                            {order.paymentMethod === "cash" && "💵 Cash"}
                                            {order.paymentMethod === "card" && "💳 Card"}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <div className="relative group">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-help",
                                                config.color
                                            )}>
                                                <Icon size={11} />
                                                {config.label}
                                            </span>
                                            {/* Tooltip showing role hint */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-white text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                {config.hint}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Time */}
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-neutral-400 whitespace-nowrap">
                                            {timeAgo}
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
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                → Mark {STATUS_CONFIG[nextStatus].label}
                                            </button>
                                        )}
                                        {!nextStatus && (
                                            <span className="text-xs text-neutral-300 font-semibold whitespace-nowrap">
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