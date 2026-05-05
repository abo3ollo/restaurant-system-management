import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/stores/cartStore";
import { toast } from "sonner";

export const useCreateOrder = () => {
    const createOrder = useMutation(api.orders.createOrder);
    const { getCart, clearCart } = useCart();

    const handleConfirm = async (
        tableId: string,
        userId: string,
        orderType: "dine_in" | "takeaway" | "delivery" = "dine_in",
        deliveryDetails?: {
            clientName: string;
            phoneNumber: string;
            address: string;
            floorNumber: string;
            apartment: string;
        }
    ) => {
        const cart = getCart(tableId);
        if (!cart.length) return;

        try {
            await createOrder({
                tableId: orderType === "dine_in" ? tableId as Id<"tables"> : undefined,
                userId: userId as Id<"users">,
                orderType,
                items: cart.map(item => ({
                    itemId: item._id,
                    quantity: item.quantity,
                    note: item.note,
                })),
                deliveryDetails: orderType === "delivery" ? deliveryDetails : undefined,
            });
            clearCart(tableId);
            toast.success("Order confirmed!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create order.");
        }
    };

    return { handleConfirm };
};