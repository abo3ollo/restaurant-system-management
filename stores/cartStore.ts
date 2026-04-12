import { create } from "zustand";
import { Id } from "@/convex/_generated/dataModel";

export type CartItem = {
    _id: Id<"menuItems">;
    name: string;
    price: number;
    image?: string;
    quantity: number;
    note?: string;
};

type CartStore = {
    carts: Record<string, CartItem[]>; // key = tableId
    addToCart: (
        tableId: string,
        item: Omit<CartItem, "quantity" | "note">,
    ) => void;
    adjustQty: (tableId: string, id: Id<"menuItems">, delta: number) => void;
    updateNote: (tableId: string, id: Id<"menuItems">, note: string) => void;
    clearCart: (tableId: string) => void;
    getCart: (tableId: string) => CartItem[];
};

export const useCart = create<CartStore>((set, get) => ({
    carts: {},

    getCart: (tableId) => get().carts[tableId] ?? [],

    addToCart: (tableId, item) =>
        set((state) => {
            const current = state.carts[tableId] ?? [];
            const existing = current.find((i) => i._id === item._id);

            const updated = existing
                ? current.map((i) =>
                    i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i,
                )
                : [...current, { ...item, quantity: 1, note: "" }];

            return { carts: { ...state.carts, [tableId]: updated } };
        }),

    adjustQty: (tableId, id, delta) =>
        set((state) => {
            const current = state.carts[tableId] ?? [];
            const updated = current
                .map((i) => (i._id === id ? { ...i, quantity: i.quantity + delta } : i))
                .filter((i) => i.quantity > 0);

            return { carts: { ...state.carts, [tableId]: updated } };
        }),

    updateNote: (tableId, id, note) =>
        set((state) => {
            const current = state.carts[tableId] ?? [];
            const updated = current.map((i) => (i._id === id ? { ...i, note } : i));
            return { carts: { ...state.carts, [tableId]: updated } };
        }),

    clearCart: (tableId) =>
        set((state) => {
            const updated = { ...state.carts };
            delete updated[tableId];
            return { carts: updated };
        }),
}));
