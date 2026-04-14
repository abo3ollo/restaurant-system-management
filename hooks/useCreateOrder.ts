"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/stores/cartStore";

export const useCreateOrder = () => {
    const createOrder = useMutation(api.orders.createOrder);
    const { getCart, clearCart } = useCart();

    const handleConfirm = async (tableId: string, userId: string) => {
        if (!getCart(tableId).length) return;

        await createOrder({
            tableId: tableId as Id<"tables">,
            userId: userId as Id<"users">,
            items: getCart(tableId).map((item) => ({
                itemId: item._id,
                quantity: item.quantity,
                note: item.note,
            })),
        });

        clearCart(tableId);
    };

    return { handleConfirm };
};