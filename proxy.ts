import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
    "/admin(.*)",
    "/cashier(.*)",
    "/waiter(.*)",
    "/super-admin(.*)",
]);

const isBillingRoute = createRouteMatcher(["/billing(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/join(.*)", "/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) return;

    if (isProtectedRoute(req) || isBillingRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};