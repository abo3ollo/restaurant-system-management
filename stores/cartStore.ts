import { create } from "zustand";
import { Id } from "@/convex/_generated/dataModel";

export type CartItem = {
    _id: Id<"menuItems">;
    name: string;
    price: number;
    image?: string;
    quantity: number;
};

type CartStore = {
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, "quantity">) => void;
    adjustQty: (id: Id<"menuItems">, delta: number) => void;
    clearCart: () => void;
};

export const useCart = create<CartStore>((set) => ({
    cart: [],

    addToCart: (item) =>
        set((state) => {
            const existing = state.cart.find((i) => i._id === item._id);
            if (existing) {
                return {
                    cart: state.cart.map((i) =>
                        i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                };
            }
            return { cart: [...state.cart, { ...item, quantity: 1 }] };
        }),

    adjustQty: (id, delta) =>
        set((state) => ({
            cart: state.cart
                .map((i) => (i._id === id ? { ...i, quantity: i.quantity + delta } : i))
                .filter((i) => i.quantity > 0),
        })),

    clearCart: () => set({ cart: [] }),
}));