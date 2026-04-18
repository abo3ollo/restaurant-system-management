// hooks/useCreateOrder.ts
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/stores/cartStore";
import { toast } from "sonner";

export const useCreateOrder = () => {
    const createOrder = useMutation(api.orders.createOrder);
    const { getCart, clearCart } = useCart();

    const handleConfirm = async (tableId: string, userId: string) => {
        const cart = getCart(tableId);
        if (!cart.length) return;

        try {
            await createOrder({
                tableId: tableId as Id<"tables">,
                userId: userId as Id<"users">,
                items: cart.map((item) => ({
                    itemId: item._id,
                    quantity: item.quantity,
                    note: item.note,
                })),
            });
            // clearCart(tableId);
            toast.success("Order confirmed!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create order.");
        }
    };

    return { handleConfirm };
};