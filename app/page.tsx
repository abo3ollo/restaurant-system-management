"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Store, ArrowRight, Loader2, CheckCircle,
    Users, ShoppingBag, BarChart2, UserCheck,
} from "lucide-react";

const FEATURES = [
    { icon: ShoppingBag, label: "Order Management",    desc: "Real-time orders across all tables" },
    { icon: Users,       label: "Staff Management",    desc: "Invite cashiers and waiters easily" },
    { icon: BarChart2,   label: "Reports & Analytics", desc: "Daily, weekly, monthly insights" },
    { icon: UserCheck,   label: "Role-Based Access",   desc: "Admin, Cashier, Waiter roles" },
];

export default function HomePage() {
    const router = useRouter();
    const { isSignedIn, isLoaded, user } = useUser();
    const currentUser = useQuery(api.users.getCurrentUser);
    const createRestaurant = useMutation(api.restaurants.createRestaurant);

    // ── Form state ──
    const [step, setStep] = useState<"landing" | "register">("landing");
    const [form, setForm] = useState({
        restaurantName: "",
        slug: "",
        address: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);

    // ── Auto-redirect if already has restaurant ──
    useEffect(() => {
        if (!isSignedIn || !isLoaded) return;
        if (currentUser === undefined) return; // loading
        if (currentUser === null) return;       // no user yet

        if (currentUser.restaurantId) {
            const routes: Record<string, string> = {
                super_admin: "/super-admin",
                admin:       "/admin",
                cashier:     "/cashier",
                waiter:      "/waiter",
            };
            router.replace(routes[currentUser.role] ?? "/admin");
        }
    }, [isSignedIn, isLoaded, currentUser]);

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const handleNameChange = (name: string) => {
        setForm(p => ({ ...p, restaurantName: name, slug: generateSlug(name) }));
    };

    const handleCreate = async () => {
        if (!form.restaurantName.trim()) {
            toast.error("Restaurant name is required");
            return;
        }
        if (!user) {
            toast.error("Please sign in first");
            return;
        }
        setLoading(true);
        try {
            await createRestaurant({
                name: form.restaurantName.trim(),
                slug: form.slug.trim(),
                address: form.address || undefined,
                phone: form.phone || undefined,
                clerkId: user.id,
                ownerName: user.fullName ?? user.username ?? "Owner",
                ownerEmail: user.emailAddresses[0]?.emailAddress ?? "",
            });
            toast.success("Restaurant created successfully!");
            window.location.href = "/admin";
        } catch (err: any) {
            toast.error(err.message ?? "Failed to create restaurant");
            setLoading(false);
        }
    };

    // ── Loading while checking auth ──
    if (!isLoaded || (isSignedIn && currentUser === undefined)) {
        return (
            <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center"
                style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <span className="text-white font-black text-lg">f</span>
                    </div>
                    <Loader2 size={18} className="animate-spin text-neutral-400" />
                </div>
            </div>
        );
    }

    // ── Signed in + has restaurant → redirecting ──
    if (isSignedIn && currentUser?.restaurantId) {
        return (
            <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center"
                style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <span className="text-white font-black text-lg">f</span>
                    </div>
                    <p className="text-sm text-neutral-400 font-medium">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-[#F7F6F3]"
            style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}
        >
            {/* ── Grid background ── */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "40px 40px" }}
            />

            {/* ── Navbar ── */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <span className="text-white font-black text-sm">f</span>
                    </div>
                    <span className="text-lg font-black text-neutral-900">foodics</span>
                </div>

                <div className="flex items-center gap-3">
                    {isSignedIn ? (
                        <button
                            onClick={() => setStep("register")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-bold transition-colors"
                        >
                            <Store size={14} />
                            Create Restaurant
                        </button>
                    ) : (
                        <>
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-colors">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-bold transition-colors">
                                    Get Started
                                </button>
                            </SignUpButton>
                        </>
                    )}
                </div>
            </nav>

            {/* ── Main Content ── */}
            <main className="relative z-10 max-w-6xl mx-auto px-8 py-16">

                {step === "landing" && (
                    <>
                        {/* ── Hero ── */}
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1.5 mb-6">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-bold text-neutral-600">
                                    Restaurant POS System
                                </span>
                            </div>

                            <h1 className="text-5xl font-black text-neutral-900 leading-tight mb-5">
                                Manage Your Restaurant
                                <br />
                                <span className="text-indigo-600">Like a Pro</span>
                            </h1>

                            <p className="text-lg text-neutral-500 max-w-xl mx-auto mb-8">
                                Full-stack POS system for restaurants. Manage tables, orders,
                                staff, payments and shifts — all in one place.
                            </p>

                            <div className="flex items-center justify-center gap-3">
                                {isSignedIn ? (
                                    <button
                                        onClick={() => setStep("register")}
                                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors shadow-lg"
                                    >
                                        <Store size={16} />
                                        Create Your Restaurant
                                        <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <>
                                        <SignUpButton mode="modal">
                                            <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors shadow-lg">
                                                <Store size={16} />
                                                Start Free
                                                <ArrowRight size={16} />
                                            </button>
                                        </SignUpButton>
                                        <SignInButton mode="modal">
                                            <button className="px-6 py-3.5 rounded-2xl border-2 border-neutral-300 hover:border-neutral-400 text-neutral-700 font-bold text-sm transition-colors">
                                                Sign In
                                            </button>
                                        </SignInButton>
                                    </>
                                )}
                            </div>

                            {/* Staff join link */}
                            <p className="text-xs text-neutral-400 mt-4">
                                Staff member?{" "}
                                <span className="font-bold text-indigo-600">
                                    Use the invitation link sent by your manager
                                </span>
                            </p>
                        </div>

                        {/* ── Features ── */}
                        <div className="grid grid-cols-4 gap-4 mb-16">
                            {FEATURES.map(f => {
                                const Icon = f.icon;
                                return (
                                    <div key={f.label} className="bg-white rounded-2xl border border-neutral-100 p-5 hover:border-neutral-200 hover:shadow-sm transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
                                            <Icon size={18} className="text-indigo-600" />
                                        </div>
                                        <p className="text-sm font-black text-neutral-900 mb-1">{f.label}</p>
                                        <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── How it works ── */}
                        <div className="bg-white rounded-3xl border border-neutral-100 p-8">
                            <h2 className="text-xl font-black text-neutral-900 mb-6 text-center">
                                Get Started in 3 Steps
                            </h2>
                            <div className="grid grid-cols-3 gap-8">
                                {[
                                    { step: "01", title: "Create Account",    desc: "Sign up with your email and create your restaurant profile." },
                                    { step: "02", title: "Set Up Your Menu",  desc: "Add your menu items, categories, and tables." },
                                    { step: "03", title: "Invite Your Team",  desc: "Invite cashiers and waiters with a single link." },
                                ].map(s => (
                                    <div key={s.step} className="text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3">
                                            <span className="text-white font-black text-sm">{s.step}</span>
                                        </div>
                                        <p className="text-sm font-black text-neutral-900 mb-1">{s.title}</p>
                                        <p className="text-xs text-neutral-400 leading-relaxed">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ── Register Step ── */}
                {step === "register" && (
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={() => setStep("landing")}
                            className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
                        >
                            ← Back
                        </button>

                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">
                            {/* Header */}
                            <div className="bg-neutral-900 px-8 py-7 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                                    <Store size={22} className="text-white" />
                                </div>
                                <h2 className="text-xl font-black text-white">Create Your Restaurant</h2>
                                <p className="text-sm text-neutral-400 mt-1">
                                    Signed in as {user?.emailAddresses[0]?.emailAddress}
                                </p>
                            </div>

                            <div className="px-8 py-6 space-y-4">
                                {/* Restaurant Name */}
                                <div>
                                    <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                        Restaurant Name *
                                    </label>
                                    <input
                                        value={form.restaurantName}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="e.g. Cairo Grill"
                                        className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                        URL Slug *
                                    </label>
                                    <div className="flex items-center border-2 border-neutral-200 focus-within:border-indigo-400 rounded-xl px-4 py-3 gap-2 transition-colors">
                                        <span className="text-sm text-neutral-400 shrink-0">foodics.app/</span>
                                        <input
                                            value={form.slug}
                                            onChange={e => setForm(p => ({ ...p, slug: generateSlug(e.target.value) }))}
                                            placeholder="cairo-grill"
                                            className="flex-1 text-sm font-bold outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                        Address (optional)
                                    </label>
                                    <input
                                        value={form.address}
                                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                        placeholder="123 Main St, Cairo"
                                        className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">
                                        Phone (optional)
                                    </label>
                                    <input
                                        value={form.phone}
                                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="+20 100 000 0000"
                                        className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                    />
                                </div>

                                <button
                                    onClick={handleCreate}
                                    disabled={loading || !form.restaurantName.trim()}
                                    className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-700 text-white font-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Creating...</>
                                    ) : (
                                        <><CheckCircle size={16} /> Create Restaurant</>
                                    )}
                                </button>
                            </div>

                            <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 text-center">
                                <p className="text-[11px] text-neutral-400">
                                    © 2025 Foodics · All rights reserved
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}