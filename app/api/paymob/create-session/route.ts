import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY!;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!;

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { plan, restaurantId, restaurantName, email, name } = await req.json();

        const amount = plan === "monthly" ? 80000 : 1440000; // in cents (EGP)
        const planLabel = plan === "monthly" ? "Monthly Plan" : "Yearly Plan";

        // Step 1: Auth token
        const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
        });
        const authData = await authRes.json();
        const token = authData.token;

        // Step 2: Create order
        const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                auth_token: token,
                delivery_needed: false,
                amount_cents: amount,
                currency: "EGP",
                items: [{
                    name: `Servix ${planLabel}`,
                    amount_cents: amount,
                    description: `Servix POS - ${planLabel}`,
                    quantity: 1,
                }],
                merchant_order_id: `${restaurantId}-${plan}-${Date.now()}`,
            }),
        });
        const orderData = await orderRes.json();

        // Step 3: Payment key
        const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                auth_token: token,
                amount_cents: amount,
                expiration: 3600,
                order_id: orderData.id,
                billing_data: {
                    apartment: "N/A",
                    email,
                    floor: "N/A",
                    first_name: name?.split(" ")[0] ?? "User",
                    last_name: name?.split(" ")[1] ?? ".",
                    street: "N/A",
                    building: "N/A",
                    phone_number: "+20100000000",
                    shipping_method: "PKG",
                    postal_code: "N/A",
                    city: "Cairo",
                    country: "EG",
                    state: "Cairo",
                },
                currency: "EGP",
                integration_id: parseInt(PAYMOB_INTEGRATION_ID),
                metadata: {
                    restaurantId,
                    plan,
                    restaurantName,
                },
            }),
        });
        const paymentKeyData = await paymentKeyRes.json();
        const paymentKey = paymentKeyData.token;

        const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

        return NextResponse.json({
            checkoutUrl,
            orderId: orderData.id,
            paymentKey,
        });
    } catch (err) {
        console.error("Paymob error:", err);
        return NextResponse.json({ error: "Payment session failed" }, { status: 500 });
    }
}