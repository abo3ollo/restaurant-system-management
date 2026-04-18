// app/_components/cashier/EditOrderModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Minus, Trash2, TrendingUp, Search } from "lucide-react";

type OrderItem = {
    _id: string;
    itemId: Id<"menuItems">;
    quantity: number;
    note?: string;
    menuItemName: string;
    menuItemPrice: number;
};

type EditableItem = {
    itemId: Id<"menuItems">;
    name: string;
    price: number;
    quantity: number;
    note: string;
};

type Props = {
    orderId: Id<"orders">;
    orderItems: OrderItem[];
    tableName: string;
    status: string;
};

export default function EditOrderModal({ orderId, orderItems, tableName, status }: Props) {
    const [open, setOpen] = useState(false);
    const [editItems, setEditItems] = useState<EditableItem[]>([]);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const updateOrder = useMutation(api.orders.updateOrder);
    const menuData = useQuery(api.menuItems.getMenu);

    useEffect(() => {
        if (open) {
            setEditItems(orderItems.map(item => ({
                itemId: item.itemId,
                name: item.menuItemName,
                price: item.menuItemPrice,
                quantity: item.quantity,
                note: item.note ?? "",
            })));
        }
    }, [open, orderItems]);

    const canEdit = status === "pending" || status === "confirmed";

    const categoryMap = new Map(
        (menuData?.categories || []).map((c: any) => [c._id, c.name])
    );

    const filteredMenu = menuData?.items
        ?.filter(item => item.available)
        ?.filter(item => activeCategory === "All" || item.categoryId === activeCategory)
        ?.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const addItem = (item: any) => {
        const existing = editItems.find(i => i.itemId === item._id);
        if (existing) {
            setEditItems(prev => prev.map(i =>
                i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setEditItems(prev => [...prev, {
                itemId: item._id,
                name: item.name,
                price: item.price,
                quantity: 1,
                note: "",
            }]);
        }
    };

    const adjustQty = (itemId: Id<"menuItems">, delta: number) => {
        setEditItems(prev => prev
            .map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + delta } : i)
            .filter(i => i.quantity > 0)
        );
    };

    const updateNote = (itemId: Id<"menuItems">, note: string) => {
        setEditItems(prev => prev.map(i =>
            i.itemId === itemId ? { ...i, note } : i
        ));
    };

    const removeItem = (itemId: Id<"menuItems">) => {
        setEditItems(prev => prev.filter(i => i.itemId !== itemId));
    };

    const subtotal = editItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = +(subtotal * 0.08).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const handleSave = async () => {
        if (editItems.length === 0) {
            toast.error("Order must have at least one item");
            return;
        }
        try {
            await updateOrder({
                orderId,
                items: editItems.map(i => ({
                    itemId: i.itemId,
                    quantity: i.quantity,
                    note: i.note || undefined,
                })),
            });
            toast.success("Order updated!");
            setOpen(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update order");
        }
    };

    if (!canEdit) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Pencil size={11} />
                    Edit Order
                
            </DialogTrigger>

            <DialogContent className="max-w-5xl w-[90vw] h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-7 py-5 border-b border-neutral-100 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-black text-neutral-900">
                                Edit Order
                            </DialogTitle>
                            <p className="text-sm text-neutral-400 mt-0.5">{tableName}</p>
                        </div>
                        <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-xl capitalize">
                            {status}
                        </span>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT: Menu Picker ── */}
                    <div className="flex-1 flex flex-col border-r border-neutral-100 overflow-hidden bg-neutral-50">
                        {/* Search + Categories */}
                        <div className="px-5 py-4 bg-white border-b border-neutral-100 shrink-0 space-y-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search menu items..."
                                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 bg-neutral-50"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-0.5">
                                <button
                                    onClick={() => setActiveCategory("All")}
                                    className={cn(
                                        "text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all",
                                        activeCategory === "All"
                                            ? "bg-neutral-900 text-white"
                                            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                                    )}
                                >All</button>
                                {menuData?.categories.map((cat: any) => (
                                    <button
                                        key={cat._id}
                                        onClick={() => setActiveCategory(cat._id)}
                                        className={cn(
                                            "text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all",
                                            activeCategory === cat._id
                                                ? "bg-neutral-900 text-white"
                                                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                                        )}
                                    >{cat.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* Menu Grid */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="grid grid-cols-3 gap-3">
                                {filteredMenu?.map(item => {
                                    const inCart = editItems.find(i => i.itemId === item._id);
                                    return (
                                        <div
                                            key={item._id}
                                            onClick={() => addItem(item)}
                                            className={cn(
                                                "bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all hover:shadow-md group relative",
                                                inCart
                                                    ? "border-indigo-300 shadow-sm shadow-indigo-100"
                                                    : "border-neutral-100 hover:border-indigo-200"
                                            )}
                                        >
                                            {/* Image */}
                                            <div className="relative h-28 overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {/* Category badge */}
                                                <div className="absolute top-2 left-2 bg-neutral-900/80 text-white text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                    <TrendingUp size={7} />
                                                    {categoryMap.get(item.categoryId)}
                                                </div>
                                                {/* Qty badge */}
                                                {inCart && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                                                        {inCart.quantity}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-3">
                                                <p className="text-sm font-bold text-neutral-800 leading-tight truncate">
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-[11px] text-neutral-400 truncate">{item.description}</p>
                                                    <span className="text-sm font-black text-indigo-600 shrink-0 ml-2">
                                                        ${item.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Order Summary ── */}
                    <div className="w-80 shrink-0 flex flex-col bg-white">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-neutral-100 shrink-0">
                            <p className="text-xs font-black text-neutral-800 uppercase tracking-widest">
                                Order Items
                                <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">
                                    {editItems.length}
                                </span>
                            </p>
                        </div>

                        {/* Items list */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                            {editItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-neutral-300 gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                                        <Plus size={24} className="text-neutral-300" />
                                    </div>
                                    <p className="text-xs font-semibold">No items</p>
                                    <p className="text-[11px] text-center">Click menu items on the left to add them</p>
                                </div>
                            ) : (
                                editItems.map(item => (
                                    <div
                                        key={item.itemId}
                                        className="bg-neutral-50 rounded-xl p-3 flex flex-col gap-2 border border-neutral-100"
                                    >
                                        {/* Name + Delete */}
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-bold text-neutral-800 leading-tight">
                                                {item.name}
                                            </p>
                                            <button
                                                onClick={() => removeItem(item.itemId)}
                                                className="text-neutral-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        {/* Qty + Price */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 bg-white rounded-lg border border-neutral-200 p-0.5">
                                                <button
                                                    onClick={() => adjustQty(item.itemId, -1)}
                                                    className="w-6 h-6 rounded-md hover:bg-neutral-100 flex items-center justify-center transition-colors"
                                                >
                                                    <Minus size={10} />
                                                </button>
                                                <span className="text-sm font-black w-6 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => adjustQty(item.itemId, 1)}
                                                    className="w-6 h-6 rounded-md hover:bg-neutral-100 flex items-center justify-center transition-colors"
                                                >
                                                    <Plus size={10} />
                                                </button>
                                            </div>
                                            <span className="text-sm font-black text-indigo-600">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Note */}
                                        <input
                                            type="text"
                                            placeholder="Add a note..."
                                            value={item.note}
                                            onChange={e => updateNote(item.itemId, e.target.value)}
                                            className="w-full text-[11px] border border-neutral-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-300 bg-white text-neutral-500 placeholder:text-neutral-300"
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Totals + Actions */}
                        <div className="px-5 py-4 border-t border-neutral-100 space-y-2 shrink-0">
                            <div className="flex justify-between text-sm text-neutral-400">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-neutral-400">
                                <span>Tax (8%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm font-black text-neutral-900 uppercase tracking-wide">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="flex-1 h-10 rounded-xl text-xs font-bold border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={editItems.length === 0}
                                    className="flex-1 h-10 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}