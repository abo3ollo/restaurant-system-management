"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useCart } from "@/stores/cartStore";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    ShoppingBasket,
    TrendingUp,
    LogOut,
    MinusCircle,
    PlusCircle,
    CheckCircle,
    CreditCard,
    Pencil,
    X,
} from "lucide-react";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import PaymentModal from "./PaymentModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";


function NewOrder() {
    const router = useRouter();
    const { signOut } = useClerk();
    const { isLoading, currentUser } = useRoleGuard(["admin", "cashier"]);

    const [activeTab, setActiveTab] = useState<"new-order" | "my-orders" | "dashboard">("new-order");
    const [activeTable, setActiveTable] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [editingOrderId, setEditingOrderId] = useState<Id<"orders"> | null>(null);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [payingOrderId, setPayingOrderId] = useState<Id<"orders"> | null>(null);
    const [payingTotal, setPayingTotal] = useState(0);
    const [payingOrder, setPayingOrder] = useState<any>(null);
    const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
    const [deliveryFormOpen, setDeliveryFormOpen] = useState(false);
    const [deliveryDetails, setDeliveryDetails] = useState({
        clientName: "",
        phoneNumber: "",
        address: "",
        floorNumber: "",
        apartment: "",
    });

    const data = useQuery(api.menuItems.getMenu);
    const tables = useQuery(api.tables.getTables);
    const allOrders = useQuery(api.orders.getOrders);
    const updateOrder = useMutation(api.orders.updateOrder);
    const { handleConfirm } = useCreateOrder();

    const { getCart, addToCart, adjustQty, updateNote, clearCart, loadOrderToCart } = useCart();

    useEffect(() => {
        if (tables && tables.length > 0 && !activeTable) {
            setActiveTable(tables[0]._id);
        }
    }, [tables, activeTable]);

    const handleChangeRole = async () => {
        await signOut();
        router.push("/");
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                    <span className="text-white font-black text-lg leading-none">f</span>
                </div>
                <p className="text-sm text-neutral-400 font-medium">Loading...</p>
            </div>
        </div>
    );

    const handleEditOrder = (order: any) => {
        if (!activeTable) return;
        loadOrderToCart(activeTable, order.items.map((item: any) => ({
            _id: item.itemId,
            name: item.menuItemName,
            price: item.menuItemPrice,
            image: item.menuItemImage ?? "",
            quantity: item.quantity,
            note: item.note ?? "",
        })));
        setEditingOrderId(order._id);
    };

    const handleCancelEdit = () => {
        setEditingOrderId(null);
        if (activeTable) clearCart(activeTable);
    };

    const handleSaveEdit = async () => {
        if (!editingOrderId || !activeTable) return;
        try {
            await updateOrder({
                orderId: editingOrderId,
                items: cart.map((item) => ({
                    itemId: item._id,
                    quantity: item.quantity,
                    note: item.note,
                })),
            });
            toast.success("Order updated!");
            setEditingOrderId(null);
            clearCart(activeTable);
        } catch (err) {
            toast.error("Failed to update order");
        }
    };

    const handleOpenPayment = (order: any) => {
        setPayingOrderId(order._id as Id<"orders">);
        setPayingTotal(order.total);
        setPayingOrder(order); // ← add this state
        setPaymentOpen(true);
        clearCart(activeTable ?? ""); // Clear cart when opening payment modal

    };

    const categoryMap = new Map((data?.categories || []).map((c: any) => [c._id, c.name]));

    const selectedCategoryName = data?.categories.find(c => c._id === activeCategory)?.name;

    const filteredItems = activeCategory === "All"
        ? data?.items?.filter(i => i.available)
        : data?.items?.filter(i =>
            i.available && (
                i.categoryId === activeCategory           // new items with proper ID
                // i.category === selectedCategoryName          // old items with string category
            )
        );

    const currentTableName = tables?.find((t) => t._id === activeTable)?.name ?? activeTable ?? "Select a table";

    const cart = getCart(activeTable ?? "");
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = +(subtotal * 0.08).toFixed(2);
    const discount = 5;
    const total = +(subtotal + tax - discount).toFixed(2);

    const orders = currentUser?.role === "admin"
        ? allOrders
        : allOrders?.filter((o) => o.userId === currentUser?._id);

    const activeTableOrders = orders?.filter((o) => {
        if (o.status === "paid") return false;
        if (orderType === "dine_in") {
            return o.tableId === activeTable;
        } else {
            return o.orderType === orderType;
        }
    }) ?? [];

    const ORDER_TYPES = [
        {
            key: "dine_in",
            label: "Dine In",
            emoji: "🍽️",
            desc: "Restaurant hall",
            color: "border-indigo-300 bg-indigo-50 text-indigo-700",
            activeColor: "ring-2 ring-indigo-400",
        },
        {
            key: "takeaway",
            label: "Takeaway",
            emoji: "🥡",
            desc: "Customer picks up",
            color: "border-amber-300 bg-amber-50 text-amber-700",
            activeColor: "ring-2 ring-amber-400",
        },
        {
            key: "delivery",
            label: "Delivery",
            emoji: "🛵",
            desc: "Deliver to address",
            color: "border-green-300 bg-green-50 text-green-700",
            activeColor: "ring-2 ring-green-400",
        },
    ];

    const payableOrder = activeTableOrders.find((o) => o.status !== "paid");

    return (
        <>
            {/* ── TABLES PANEL ── */}
            <div className={cn(
                "w-60 shrink-0 bg-white border-l border-neutral-100 flex flex-col pt-5",
                orderType !== "dine_in" && "hidden"
            )}>
                {/* ... existing tables list ... */}
                <div className="w-60 shrink-0 bg-white border-l border-neutral-100 flex flex-col pt-5">
                    {activeTab === "new-order" && (
                        <>
                            <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-3 px-1">
                                Select Table
                            </p>
                            <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
                                {tables?.map((table) => {
                                    const tableCart = getCart(table._id);
                                    const isBusy = table.status === "occupied" || tableCart.length > 0;
                                    return (
                                        <button
                                            key={table._id}
                                            onClick={() => setActiveTable(table._id)}
                                            className={cn(
                                                "text-left rounded-2xl p-3 border transition-all",
                                                activeTable === table._id
                                                    ? "border-amber-300 bg-amber-50 shadow-sm"
                                                    : "border-neutral-100 bg-white hover:border-neutral-200",
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-neutral-800">{table.name}</span>
                                                <span className={cn("w-2 h-2 rounded-full", isBusy ? "bg-red-400" : "bg-green-400")} />
                                            </div>
                                            <p className="text-xs text-neutral-400 mt-0.5">
                                                {table.capacity ? `${table.capacity} Guests` : table.status}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── MENU ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Order Type Tabs - Top */}
                <div className="bg-white border-b border-neutral-100 px-6 py-3 shrink-0">
                    <div className="flex gap-2">
                        {ORDER_TYPES.map(t => (
                            <button
                                key={t.key}
                                onClick={() => {
                                    setOrderType(t.key as any);
                                    if (t.key === "delivery") {
                                        setDeliveryFormOpen(true);
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-semibold text-sm",
                                    orderType === t.key
                                        ? `${t.color} ${t.activeColor} border-current`
                                        : "border-neutral-100 bg-white hover:border-neutral-200 text-neutral-600"
                                )}
                            >
                                <span className="text-lg">{t.emoji}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white border-b border-neutral-100 px-6 py-4 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-sm font-black text-neutral-900">
                                {orderType === "dine_in"
                                    ? (tables?.find((t) => t._id === activeTable)?.name ?? "Select a table")
                                    : orderType === "takeaway"
                                        ? "Takeaway Order"
                                        : "Delivery Order"
                                }
                            </h2>
                            <p className="text-xs text-neutral-400">Tap items to add to order</p>
                        </div>
                        {cart.length > 0 && (
                            <span className="bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full">
                                {cart.reduce((s, i) => s + i.quantity, 0)} items
                            </span>
                        )}
                    </div>
                    <div className="flex gap-4 overflow-x-auto">
                        <button
                            onClick={() => setActiveCategory("All")}
                            className={cn("text-sm font-semibold pb-1 shrink-0 transition-all",
                                activeCategory === "All"
                                    ? "text-neutral-900 border-b-2 border-neutral-900"
                                    : "text-neutral-400 hover:text-neutral-700",
                            )}
                        >All</button>
                        {data?.categories.map((cat) => (
                            <button
                                key={cat._id}
                                onClick={() => setActiveCategory(cat._id)}
                                className={cn("text-sm font-semibold pb-1 shrink-0 transition-all",
                                    activeCategory === cat._id
                                        ? "text-neutral-900 border-b-2 border-neutral-900"
                                        : "text-neutral-400 hover:text-neutral-700",
                                )}
                            >{cat.name}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {filteredItems?.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => {
                                    if (!activeTable) return;
                                    addToCart(activeTable, {
                                        _id: item._id,
                                        name: item.name,
                                        price: item.price,
                                        image: item.image,
                                    });
                                }}
                                className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="relative h-32 overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-2 left-2 bg-neutral-900 text-white text-[9px] font-bold tracking-widest px-2 py-1 rounded-lg flex items-center gap-1">
                                        <TrendingUp size={9} />
                                        {categoryMap.get(item.categoryId)}
                                    </div>
                                    {getCart(activeTable ?? "").find((i) => i._id === item._id) && (
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">
                                            {getCart(activeTable ?? "").find((i) => i._id === item._id)?.quantity}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-1">
                                        <h3 className="text-sm font-bold text-neutral-800 leading-tight">{item.name}</h3>
                                        <span className="text-sm font-black text-amber-600 shrink-0">{item.price}$</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── ORDER SUMMARY ── */}
            <aside className="w-72 shrink-0 bg-white border-l border-neutral-100 flex flex-col">
                {/* Header */}
                <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black tracking-wide text-neutral-800 uppercase">
                            Order Summary
                        </h2>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                            User: {currentUser?.name || "Cashier"}
                        </p>
                    </div>
                </div>

                {/* Table badge */}
                <div className="mx-5 mt-4 flex items-center gap-3 bg-neutral-50 rounded-2xl p-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                        <ShoppingBasket size={16} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                            {orderType === "dine_in" ? "Current Table" : orderType === "takeaway" ? "Order Type" : "Delivery Info"}
                        </p>
                        <p className="text-sm font-black text-neutral-800">
                            {orderType === "dine_in"
                                ? currentTableName
                                : orderType === "takeaway"
                                    ? "Takeaway"
                                    : "Delivery"}
                        </p>
                    </div>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 flex flex-col gap-3 min-h-0">
                    {cart.length === 0 && activeTableOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-300 gap-2">
                            <ShoppingBasket size={32} />
                            <p className="text-xs font-semibold">No items yet</p>
                            <p className="text-[11px]">Tap a menu item to add it</p>
                        </div>
                    ) : (
                        <>
                            {/* New cart items */}
                            {cart.map((item) => (
                                <div key={item._id} className="flex flex-col gap-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-bold text-neutral-800">{item.name}</p>
                                        <span className="text-sm font-black text-neutral-700 shrink-0">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => adjustQty(activeTable ?? "", item._id, -1)}>
                                            <MinusCircle size={15} className="cursor-pointer" />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => adjustQty(activeTable ?? "", item._id, 1)}>
                                            <PlusCircle size={15} className="cursor-pointer" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add a note..."
                                        value={item.note ?? ""}
                                        onChange={(e) => updateNote(activeTable ?? "", item._id, e.target.value)}
                                        className="w-full text-[11px] border border-neutral-100 rounded-lg px-2 py-1 outline-none focus:border-amber-300 text-neutral-500 placeholder:text-neutral-300"
                                    />
                                    <Separator />
                                </div>
                            ))}

                            {/* Active orders for this table */}
                            {activeTableOrders.map((order, idx) => (
                                <div
                                    key={order._id}
                                    className={cn(
                                        "rounded-xl p-3 border transition-all",
                                        editingOrderId === order._id
                                            ? "bg-indigo-50 border-indigo-200"
                                            : order.status === "served"
                                                ? "bg-green-50 border-green-200"
                                                : "bg-neutral-50 border-neutral-100",
                                    )}
                                >
                                    {/* Order header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-black text-neutral-700">
                                            Order #{String(idx + 1).padStart(4, "0")}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-lg",
                                                order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                    order.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                                                        order.status === "preparing" ? "bg-orange-100 text-orange-700" :
                                                            order.status === "served" ? "bg-green-100 text-green-700" :
                                                                "bg-neutral-100 text-neutral-500"
                                            )}>
                                                {order.status}
                                            </span>

                                            {/* Edit toggle */}
                                            {(order.status === "pending" || order.status === "confirmed") && (
                                                editingOrderId === order._id ? (
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="text-[10px] font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded-lg transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditOrder(order)}
                                                        className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <Pencil size={9} />
                                                        Edit
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Order items */}
                                    <div className="flex flex-col gap-0.5 mb-2">
                                        {order.orderType === "delivery" && order.deliveryDetails && (
                                            <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-[10px] font-bold text-blue-700 mb-1">DELIVERY INFO</p>
                                                <p className="text-[10px] text-blue-600"><span className="font-bold">Client:</span> {order.deliveryDetails.clientName}</p>
                                                <p className="text-[10px] text-blue-600"><span className="font-bold">Phone:</span> {order.deliveryDetails.phoneNumber}</p>
                                                <p className="text-[10px] text-blue-600"><span className="font-bold">Address:</span> {order.deliveryDetails.address}</p>
                                                {order.deliveryDetails.floorNumber && (
                                                    <p className="text-[10px] text-blue-600"><span className="font-bold">Floor:</span> {order.deliveryDetails.floorNumber}</p>
                                                )}
                                                {order.deliveryDetails.apartment && (
                                                    <p className="text-[10px] text-blue-600"><span className="font-bold">Apt:</span> {order.deliveryDetails.apartment}</p>
                                                )}
                                            </div>
                                        )}
                                        {order.items.map((item: any) => (
                                            <p key={item._id} className="text-[11px] text-neutral-500">
                                                <span className="font-bold">{item.quantity}x</span> {item.menuItemName}
                                                {item.note && (
                                                    <span className="text-neutral-400 italic ml-1">({item.note})</span>
                                                )}
                                            </p>
                                        ))}
                                    </div>

                                    {/* Order footer */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-indigo-600">
                                            ${order.total.toFixed(2)}
                                        </p>

                                        {/* Pay button for served orders */}
                                        {order.status === "served" && (
                                            <button
                                                onClick={() => handleOpenPayment(order)}
                                                className="flex items-center gap-1 text-[10px] font-bold text-white bg-green-500 hover:bg-green-600 px-2.5 py-1 rounded-lg transition-colors"
                                            >
                                                <CreditCard size={10} />
                                                Pay
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Totals */}
                <div className="px-5 py-4 border-t border-neutral-100 space-y-2 shrink-0">
                    <div className="flex justify-between text-sm text-neutral-500">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                        <span>Tax (8%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-rose-500 font-medium">
                        <span>Discount (Promo)</span>
                        <span>-${discount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-black text-neutral-900 uppercase tracking-wide">
                        <span>Total Amount</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex flex-col gap-2 shrink-0">
                    {editingOrderId ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="w-full rounded-xl h-10 text-xs font-bold tracking-wide border-neutral-200 text-neutral-700"
                            >
                                Cancel Edit
                            </Button>
                            <Button
                                disabled={cart.length === 0}
                                onClick={handleSaveEdit}
                                className="w-full rounded-xl h-12 text-sm font-black tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                            >
                                <CheckCircle size={15} className="mr-2" />
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                disabled={cart.length === 0}
                                onClick={() => {
                                    if (!activeTable || !currentUser?._id) return;
                                    if (orderType === "delivery") {
                                        if (!deliveryDetails.clientName || !deliveryDetails.phoneNumber || !deliveryDetails.address) {
                                            toast.error("Please complete delivery information first");
                                            return;
                                        }
                                        handleConfirm(activeTable, currentUser._id, orderType, deliveryDetails);
                                    } else {
                                        handleConfirm(activeTable, currentUser._id, orderType);
                                    }
                                }}
                                variant="outline"
                                className="w-full rounded-xl h-10 text-xs font-bold tracking-wide border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            >
                                <CheckCircle size={13} className="mr-2" />
                                Confirm Order
                            </Button>
                            <Button
                                disabled={!payableOrder}
                                onClick={() => {
                                    if (payableOrder) handleOpenPayment(payableOrder);
                                }}
                                className="w-full rounded-xl h-12 text-sm font-black tracking-wide bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 disabled:opacity-40"
                            >
                                <CreditCard size={15} className="mr-2" />
                                {payableOrder
                                    ? `Pay Now — $${payableOrder.total.toFixed(2)}`
                                    : "Pay Now"
                                }
                            </Button>
                        </>
                    )}
                </div>
            </aside>

            {/* Payment Modal */}
            <PaymentModal
                open={paymentOpen}
                onClose={() => {
                    setPaymentOpen(false);
                    setPayingOrderId(null);
                    setPayingTotal(0);
                    setPayingOrder(null);
                }}
                total={payingTotal}
                orderId={payingOrderId}
                orderNumber={String(
                    (orders?.findIndex(o => o._id === payingOrderId) ?? 0) + 1
                ).padStart(4, "0")}
                tableName={payingOrder?.tableName ?? ""}
                cashierName={currentUser?.name ?? "Cashier"}
                orderType={payingOrder?.orderType ?? "dine_in"}
                items={payingOrder?.items?.map((i: any) => ({
                    name: i.menuItemName,
                    quantity: i.quantity,
                    price: i.menuItemPrice,
                })) ?? []}
                deliveryDetails={payingOrder?.deliveryDetails}
                onSuccess={() => {
                    // setPayingOrderId(null);
                    // setPayingTotal(0);
                    // setPayingOrder(null);
                    // clearCart(activeTable ?? "");
                }}
            />

            {/* Delivery Form Modal */}
            <Dialog open={deliveryFormOpen} onOpenChange={setDeliveryFormOpen}>
                <DialogContent className="max-w-sm rounded-3xl p-6">
                    <div>
                        <h2 className="text-xl font-black text-neutral-900 mb-4">Delivery Information</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1">
                                    Client Name
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Enter client name"
                                    value={deliveryDetails.clientName}
                                    onChange={(e) =>
                                        setDeliveryDetails({ ...deliveryDetails, clientName: e.target.value })
                                    }
                                    className="rounded-xl border-neutral-200"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1">
                                    Phone Number
                                </label>
                                <Input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={deliveryDetails.phoneNumber}
                                    onChange={(e) =>
                                        setDeliveryDetails({ ...deliveryDetails, phoneNumber: e.target.value })
                                    }
                                    className="rounded-xl border-neutral-200"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1">
                                    Address
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Enter street address"
                                    value={deliveryDetails.address}
                                    onChange={(e) =>
                                        setDeliveryDetails({ ...deliveryDetails, address: e.target.value })
                                    }
                                    className="rounded-xl border-neutral-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1">
                                        Floor Number
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. 3"
                                        value={deliveryDetails.floorNumber}
                                        onChange={(e) =>
                                            setDeliveryDetails({ ...deliveryDetails, floorNumber: e.target.value })
                                        }
                                        className="rounded-xl border-neutral-200"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-1">
                                        Apartment
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. 301"
                                        value={deliveryDetails.apartment}
                                        onChange={(e) =>
                                            setDeliveryDetails({ ...deliveryDetails, apartment: e.target.value })
                                        }
                                        className="rounded-xl border-neutral-200"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setDeliveryFormOpen(false)}
                                className="flex-1 rounded-full h-11"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (!deliveryDetails.clientName || !deliveryDetails.phoneNumber || !deliveryDetails.address) {
                                        toast.error("Please fill in all required fields");
                                        return;
                                    }
                                    setDeliveryFormOpen(false);
                                    toast.success("Delivery info saved!");
                                }}
                                className="flex-1 rounded-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-bold"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default NewOrder;