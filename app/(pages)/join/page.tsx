"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useUser, SignIn } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
    CheckCircle2, AlertTriangle, Loader2,
    Store, UserCheck, Clock,
} from "lucide-react";

const ROLE_CONFIG = {
    cashier: { label: "Cashier", color: "text-amber-600", bg: "bg-amber-50" },
    waiter:  { label: "Waiter",  color: "text-emerald-600", bg: "bg-emerald-50" },
    admin:   { label: "Admin",   color: "text-indigo-600", bg: "bg-indigo-50" },
};

export default function JoinPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";

    const { isSignedIn, isLoaded } = useUser();
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ role: string; route: string; restaurantName: string } | null>(null);

    const invitation = useQuery(
        api.invitations.getInvitationByToken,
        token ? { token } : "skip"
    );
    const acceptInvitation = useMutation(api.invitations.acceptInvitation);

    // Auto-accept when signed in
    useEffect(() => {
        if (!isSignedIn || !isLoaded || !token) return;
        if (accepted || accepting) return;
        if (!invitation || invitation.status !== "pending" || invitation.isExpired) return;

        handleAccept();
    }, [isSignedIn, isLoaded, invitation]);

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);
        setError(null);
        try {
            const res = await acceptInvitation({ token });
            setResult(res);
            setAccepted(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = res.route;
            }, 2000);
        } catch (err: any) {
            setError(err.message ?? "Failed to accept invitation");
        } finally {
            setAccepting(false);
        }
    };

    // ── Loading ──
    if (!isLoaded || invitation === undefined) {
        return (
            <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-neutral-400" />
            </div>
        );
    }

    // ── Invalid token ──
    if (!invitation) {
        return <ErrorScreen message="Invitation not found or invalid." />;
    }

    // ── Expired ──
    if (invitation.isExpired) {
        return <ErrorScreen message="This invitation has expired. Please ask your admin to resend it." />;
    }

    // ── Already accepted ──
    if (invitation.status === "accepted") {
        return <ErrorScreen message="This invitation has already been used." />;
    }

    const roleConfig = ROLE_CONFIG[invitation.role as keyof typeof ROLE_CONFIG];

    return (
        <div
            className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6"
            style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}
        >
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "40px 40px" }}
            />

            <div className="w-full max-w-md relative">
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">

                    {/* Header */}
                    <div className="bg-neutral-900 px-8 py-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                            <UserCheck size={24} className="text-white" />
                        </div>
                        <h1 className="text-xl font-black text-white">You're Invited!</h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            Join {invitation.restaurantName}
                        </p>
                    </div>

                    <div className="px-8 py-6 space-y-4">

                        {/* ── Success state ── */}
                        {accepted && result && (
                            <div className="text-center space-y-4 py-4">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={32} className="text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-neutral-900">
                                        Welcome to {result.restaurantName}!
                                    </h2>
                                    <p className="text-sm text-neutral-400 mt-1">
                                        Redirecting you to your dashboard...
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-neutral-400">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span className="text-xs">Please wait...</span>
                                </div>
                            </div>
                        )}

                        {/* ── Error state ── */}
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                <p className="text-sm text-red-600 font-semibold">{error}</p>
                            </div>
                        )}

                        {/* ── Invitation details ── */}
                        {!accepted && (
                            <>
                                {/* Restaurant info */}
                                <div className="bg-neutral-50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center">
                                            <Store size={16} className="text-neutral-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">Restaurant</p>
                                            <p className="text-sm font-black text-neutral-900">{invitation.restaurantName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", roleConfig?.bg)}>
                                            <UserCheck size={16} className={roleConfig?.color} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">Your Role</p>
                                            <p className={cn("text-sm font-black", roleConfig?.color)}>
                                                {roleConfig?.label}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center">
                                            <Clock size={16} className="text-neutral-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widests">Expires</p>
                                            <p className="text-sm font-semibold text-neutral-700">
                                                {new Date(invitation.expiresAt).toLocaleDateString("en", {
                                                    month: "short", day: "numeric", year: "numeric"
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Not signed in → show sign in ── */}
                                {!isSignedIn && (
                                    <div className="space-y-3">
                                        <p className="text-sm text-neutral-500 text-center">
                                            Sign in or create an account to accept this invitation
                                        </p>
                                        <SignIn
                                            fallbackRedirectUrl={`/join?token=${token}`}
                                            appearance={{
                                                elements: {
                                                    rootBox: "w-full",
                                                    card: "shadow-none border-0 p-0 w-full",
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {/* ── Signed in → accepting ── */}
                                {isSignedIn && (
                                    <div className="text-center space-y-3 py-2">
                                        {accepting ? (
                                            <div className="flex items-center justify-center gap-2 text-neutral-500">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span className="text-sm font-semibold">Joining restaurant...</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleAccept}
                                                className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={16} />
                                                Accept Invitation
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 text-center">
                        <p className="text-[11px] text-neutral-400 font-medium">
                            © 2025 Foodics · All rights reserved
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Error Screen ──────────────────────────────────────
function ErrorScreen({ message }: { message: string }) {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-6"
            style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl p-10 max-w-sm w-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                    <AlertTriangle size={28} className="text-red-500" />
                </div>
                <h2 className="text-lg font-black text-neutral-900">Invalid Invitation</h2>
                <p className="text-sm text-neutral-400">{message}</p>
                <button
                    onClick={() => router.push("/")}
                    className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
}