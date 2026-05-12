import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const PAYMOB_API_KEY       = process.env.PAYMOB_API_KEY!;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!;
const PAYMOB_IFRAME_ID      = process.env.PAYMOB_IFRAME_ID!;
const APP_URL               = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { plan, restaurantId, restaurantName, email, name } = await req.json();

        const amount = plan === "monthly" ? 80000 : 1440000; // cents
        const planLabel = plan === "monthly" ? "Monthly Plan" : "Yearly Plan";

        // Step 1 — Auth token
        const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
        });
        const { token } = await authRes.json();

        // Step 2 — Create order
        // ← merchant_order_id encodes restaurantId + plan for webhook
        const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                auth_token: token,
                delivery_needed: false,
                amount_cents: amount,
                currency: "EGP",
                merchant_order_id: `${restaurantId}-${plan}-${Date.now()}`,
                items: [{
                    name: `Servix ${planLabel}`,
                    amount_cents: amount,
                    description: `Servix POS — ${planLabel}`,
                    quantity: 1,
                }],
            }),
        });
        const orderData = await orderRes.json();

        // Step 3 — Payment key
        const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                auth_token: token,
                amount_cents: amount,
                expiration: 3600,
                order_id: orderData.id,
                billing_data: {
                    apartment:       "N/A",
                    email:           email ?? "user@email.com",
                    floor:           "N/A",
                    first_name:      name?.split(" ")[0] ?? "User",
                    last_name:       name?.split(" ")[1] ?? ".",
                    street:          "N/A",
                    building:        "N/A",
                    phone_number:    "+20100000000",
                    shipping_method: "PKG",
                    postal_code:     "N/A",
                    city:            "Cairo",
                    country:         "EG",
                    state:           "Cairo",
                },
                currency: "EGP",
                integration_id: parseInt(PAYMOB_INTEGRATION_ID),
                // ← Redirect back to billing page after payment
                redirect_url: `${APP_URL}/billing?success=true&plan=${plan}`,
            }),
        });
        const { token: paymentKey } = await paymentKeyRes.json();

        const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

        return NextResponse.json({
            checkoutUrl,
            orderId: orderData.id,
        });

    } catch (err) {
        console.error("Paymob session error:", err);
        return NextResponse.json({ error: "Payment session failed" }, { status: 500 });
    }
}