"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    ShoppingBag, LayoutGrid, CreditCard, BarChart2,
    ArrowRight, Play, Check, Globe, DollarSign,
    ChevronDown, Shield, Phone, Clock, Star,
    Loader2, Store, CheckCircle,
} from "lucide-react";

// ── Types ──
type PlanKey = "trial" | "monthly" | "yearly";

// ── Data ──
const NAV_LINKS = ["Features", "How It Works", "Pricing", "Demo", "Testimonials", "FAQ"];

const FEATURES = [
    { icon: ShoppingBag, label: "Smart Orders",       desc: "Real-time order management" },
    { icon: LayoutGrid,  label: "Table Management",   desc: "Track and manage your tables" },
    { icon: CreditCard,  label: "Easy Payments",      desc: "Cash, card, and receipts" },
    { icon: BarChart2,   label: "Reports & Analytics", desc: "Daily insights to grow your business" },
];

const PLANS = [
    {
        key: "trial" as PlanKey,
        num: "1",
        numColor: "bg-indigo-100 text-indigo-600",
        title: "Free Trial",
        subtitle: "Try all features free for 7 days",
        price: "7 Days",
        priceSub: "Free",
        priceColor: "text-neutral-900",
        features: ["All Features Included", "No Credit Card Required", "Cancel Anytime"],
        btnLabel: "Start Free Trial",
        btnClass: "border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50",
        badge: null,
    },
    {
        key: "monthly" as PlanKey,
        num: "2",
        numColor: "bg-green-100 text-green-600",
        title: "Monthly Plan",
        subtitle: "Perfect for growing restaurants",
        price: "$800",
        priceSub: "/ month",
        priceOld: "(instead of $1,500)",
        priceColor: "text-neutral-900",
        features: ["All Features Included", "Priority Support", "Regular Updates"],
        btnLabel: "Get Started Monthly",
        btnClass: "border-2 border-green-500 text-green-600 hover:bg-green-50",
        badge: null,
    },
    {
        key: "yearly" as PlanKey,
        num: "3",
        numColor: "bg-orange-100 text-orange-500",
        title: "Yearly Plan",
        subtitle: "Best value for your business",
        price: "$14,400",
        priceSub: "/ year",
        priceOld: "(instead of $18,000)",
        priceColor: "text-neutral-900",
        features: ["All Features Included", "Priority Support", "Save $3,600 (20% off)", "Regular Updates"],
        btnLabel: "Get Started Yearly",
        btnClass: "border-2 border-orange-400 text-orange-500 hover:bg-orange-50",
        badge: "Best Value",
    },
];

const STATS = [
    { icon: Star,   value: "500+",  label: "Restaurants Trust Us" },
    { icon: Shield, value: "99.9%", label: "Uptime & Reliability" },
    { icon: Phone,  value: "24/7",  label: "Customer Support" },
    { icon: Shield, value: "Secure", label: "Your Data is Safe" },
];

// ── Mock POS Screenshot ──
function POSMockup() {
    return (
        <div className="relative w-full h-full">
            {/* Tablet mockup */}
            <div className="absolute right-0 top-0 w-130 h-85 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <span className="text-white font-black text-[10px]">S</span>
                        </div>
                        <span className="text-sm font-black text-neutral-800">servix</span>
                    </div>
                    <div className="flex-1 mx-4">
                        <div className="bg-neutral-100 rounded-lg px-3 py-1 text-[11px] text-neutral-400">
                            Search menu items...
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600 font-semibold">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">C</div>
                        Cashier
                    </div>
                </div>

                <div className="flex h-full">
                    {/* Sidebar */}
                    <div className="w-36 border-r border-neutral-100 px-3 py-3 flex flex-col gap-1">
                        {["New Order", "Orders", "Tables"].map((item, i) => (
                            <div key={item} className={cn(
                                "px-3 py-2 rounded-xl text-[11px] font-bold transition-colors",
                                i === 2 ? "bg-indigo-50 text-indigo-700" : "text-neutral-500"
                            )}>
                                {item}
                            </div>
                        ))}
                    </div>

                    {/* Tables grid */}
                    <div className="flex-1 px-3 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-black text-neutral-800">Tables</span>
                        </div>
                        <div className="flex gap-1 mb-3">
                            {["All", "Indoor", "Outdoor", "VIP"].map((t, i) => (
                                <span key={t} className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-bold",
                                    i === 0 ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-500"
                                )}>{t}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { name: "Table 01", status: "Available", color: "text-green-600", dot: "bg-green-500" },
                                { name: "Table 02", status: "Occupied",  color: "text-red-500",   dot: "bg-red-500" },
                                { name: "Table 03", status: "Available", color: "text-green-600", dot: "bg-green-500" },
                                { name: "Table 04", status: "Reserved",  color: "text-orange-500", dot: "bg-orange-400" },
                                { name: "Table 05", status: "Available", color: "text-green-600", dot: "bg-green-500" },
                                { name: "Table 06", status: "Occupied",  color: "text-red-500",   dot: "bg-red-500" },
                            ].map(t => (
                                <div key={t.name} className="bg-neutral-50 rounded-xl p-2 border border-neutral-100">
                                    <p className="text-[10px] font-black text-neutral-800 mb-1">{t.name}</p>
                                    <div className="flex items-center gap-1">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />
                                        <span className={cn("text-[9px] font-bold", t.color)}>{t.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="w-40 border-l border-neutral-100 px-3 py-3">
                        <p className="text-[11px] font-black text-neutral-800 mb-2">Order Summary</p>
                        {[
                            { name: "2x Margherita Pizza", price: "$24.00" },
                            { name: "1x Coca Cola",        price: "$2.50" },
                            { name: "1x French Fries",     price: "$4.50" },
                        ].map(item => (
                            <div key={item.name} className="flex justify-between text-[9px] mb-1.5">
                                <span className="text-neutral-600">{item.name}</span>
                                <span className="font-bold text-neutral-800">{item.price}</span>
                            </div>
                        ))}
                        <div className="border-t border-neutral-100 mt-2 pt-2 space-y-1">
                            <div className="flex justify-between text-[9px]">
                                <span className="text-neutral-500">Subtotal</span>
                                <span className="font-semibold">$31.00</span>
                            </div>
                            <div className="flex justify-between text-[9px]">
                                <span className="text-neutral-500">Tax (8%)</span>
                                <span className="font-semibold">$2.48</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black">
                                <span>Total</span>
                                <span>$33.48</span>
                            </div>
                        </div>
                        <button className="w-full mt-2 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black">
                            Pay $33.48
                        </button>
                    </div>
                </div>
            </div>

            {/* Phone mockup */}
            <div className="absolute left-10 top-20 w-45 bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden" style={{ zIndex: 10 }}>
                <div className="bg-neutral-800 px-4 py-3 flex items-center justify-between">
                    <span className="text-white text-[10px] font-black">New Order</span>
                    <div className="w-4 h-4 rounded-full bg-neutral-600" />
                </div>
                <div className="px-3 py-2">
                    <div className="flex gap-1 mb-2">
                        {["All", "Pizza", "Drinks", "Desserts"].map((c, i) => (
                            <span key={c} className={cn(
                                "px-1.5 py-0.5 rounded-md text-[8px] font-bold",
                                i === 0 ? "bg-indigo-600 text-white" : "text-neutral-400"
                            )}>{c}</span>
                        ))}
                    </div>
                    {[
                        { name: "Margherita Pizza", price: "$12.00", img: "🍕" },
                        { name: "Pepperoni Pizza",  price: "$14.00", img: "🍕" },
                        { name: "Coca Cola",        price: "$2.00",  img: "🥤" },
                        { name: "French Fries",     price: "$4.50",  img: "🍟" },
                    ].map(item => (
                        <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-neutral-50">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{item.img}</span>
                                <div>
                                    <p className="text-[9px] font-bold text-neutral-800">{item.name}</p>
                                    <p className="text-[8px] text-neutral-400">{item.price}</p>
                                </div>
                            </div>
                            <button className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">+</button>
                        </div>
                    ))}
                </div>
                <div className="px-3 py-2">
                    <button className="w-full py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black">
                        View Cart (3) $29.00
                    </button>
                </div>
            </div>

            {/* Receipt mockup */}
            <div className="absolute right-8 bottom-5 w-35 bg-white rounded-xl shadow-xl border border-neutral-200 p-3" style={{ zIndex: 10 }}>
                <div className="text-center mb-2">
                    <p className="text-[10px] font-black text-neutral-800">servix</p>
                    <p className="text-[8px] text-neutral-400">Order #00042</p>
                </div>
                <div className="space-y-1 mb-2">
                    {["2x Margherita", "1x Pizza Plus", "1x French Fries"].map(i => (
                        <div key={i} className="flex justify-between text-[8px]">
                            <span className="text-neutral-600">{i}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-dashed border-neutral-200 pt-1.5">
                    <div className="flex justify-between text-[9px] font-black">
                        <span>Total</span><span>$33.48</span>
                    </div>
                </div>
                <p className="text-center text-[8px] text-neutral-400 mt-1.5">Thank you!</p>
            </div>

            {/* Printer icon */}
            <div className="absolute -right-2.5 bottom-7.5 w-24 h-16 bg-neutral-800 rounded-xl shadow-xl flex items-center justify-center" style={{ zIndex: 5 }}>
                <div className="w-16 h-3 bg-neutral-600 rounded-sm" />
            </div>
        </div>
    );
}

// ── Main Component ──
export default function ServixLanding() {
    const router = useRouter();
    const { isSignedIn, isLoaded, user } = useUser();
    const currentUser = useQuery(api.users.getCurrentUser);
    const createRestaurant = useMutation(api.restaurants.createRestaurant);

    const [step, setStep] = useState<"landing" | "register">("landing");
    const [form, setForm] = useState({ restaurantName: "", slug: "", address: "", phone: "" });
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState<"English" | "العربية">("English");
    const [currency, setCurrency] = useState("USD ($)");

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const handleNameChange = (name: string) => {
        setForm(p => ({ ...p, restaurantName: name, slug: generateSlug(name) }));
    };

    const handleCreate = async () => {
        if (!form.restaurantName.trim()) { toast.error("Restaurant name is required"); return; }
        if (!user) { toast.error("Please sign in first"); return; }
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
            toast.success("Restaurant created!");
            window.location.href = "/admin";
        } catch (err: any) {
            toast.error(err.message ?? "Failed");
            setLoading(false);
        }
    };

    // Auto-redirect
    if (isSignedIn && currentUser?.restaurantId) {
        const routes: Record<string, string> = {
            super_admin: "/super-admin", admin: "/admin",
            cashier: "/cashier", waiter: "/waiter",
        };
        if (typeof window !== "undefined") {
            window.location.href = routes[currentUser.role] ?? "/admin";
        }
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-black text-sm">S</span>
                        </div>
                        <span className="text-xl font-black text-neutral-900 tracking-tight">servix</span>
                    </div>

                    {/* Nav links */}
                    <div className="hidden md:flex items-center gap-7">
                        {NAV_LINKS.map(link => (
                            <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`}
                                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-3">
                        {/* Language */}
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                            <Globe size={14} />
                            {lang}
                            <ChevronDown size={12} />
                        </button>

                        {/* Currency */}
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                            <DollarSign size={13} />
                            {currency}
                            <ChevronDown size={12} />
                        </button>

                        {/* CTA */}
                        {isSignedIn ? (
                            <button
                                onClick={() => setStep("register")}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm shadow-indigo-200"
                            >
                                Get Started
                            </button>
                        ) : (
                            <SignUpButton mode="modal">
                                <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm shadow-indigo-200">
                                    Get Started
                                </button>
                            </SignUpButton>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section id="features" className="max-w-7xl mx-auto px-8 pt-16 pb-8">
                <div className="grid grid-cols-2 gap-12 items-center">
                    {/* Left */}
                    <div>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-xs font-semibold text-indigo-700">
                                All-in-One Restaurant Management System
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl font-black text-neutral-900 leading-[1.1] mb-5">
                            Run Your Restaurant
                            <br />
                            Smarter, Faster,{" "}
                            <span className="text-indigo-600">Easier</span>
                        </h1>

                        <p className="text-lg text-neutral-500 leading-relaxed mb-8 max-w-md">
                            Manage orders, tables, staff, menu, payments, and reports —
                            all in one powerful and simple system.
                        </p>

                        {/* Feature pills */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-10">
                            {FEATURES.map(f => {
                                const Icon = f.icon;
                                return (
                                    <div key={f.label} className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                            <Icon size={18} className="text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-neutral-800">{f.label}</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">{f.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CTA buttons */}
                        <div className="flex items-center gap-4">
                            {isSignedIn ? (
                                <button
                                    onClick={() => setStep("register")}
                                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-200"
                                >
                                    Start Free 7-Day Trial
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <SignUpButton mode="modal">
                                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-200">
                                        Start Free 7-Day Trial
                                        <ArrowRight size={16} />
                                    </button>
                                </SignUpButton>
                            )}
                            <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-neutral-200 hover:border-neutral-300 text-neutral-700 font-bold text-sm transition-colors">
                                <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center">
                                    <Play size={10} className="text-white ml-0.5" fill="white" />
                                </div>
                                Watch Demo
                            </button>
                        </div>

                        <p className="text-xs text-neutral-400 mt-4 flex items-center gap-1.5">
                            <Shield size={12} className="text-green-500" />
                            No credit card required • Setup in less than 5 minutes
                        </p>
                    </div>

                    {/* Right — POS mockup */}
                    <div className="relative h-95">
                        {/* Background blobs */}
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-3xl" />
                        <div className="absolute top-8 right-8 w-48 h-48 bg-indigo-200/30 rounded-full blur-3xl" />
                        <div className="absolute bottom-8 left-8 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl" />
                        <div className="relative h-full p-6">
                            <POSMockup />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Demo + Pricing ── */}
            <section id="demo" className="bg-neutral-50 border-y border-neutral-100 py-16">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-5 gap-8">

                        {/* Demo / Video — left (2/5) */}
                        <div className="col-span-2">
                            <h2 className="text-2xl font-black text-neutral-900 mb-1">See Servix in Action</h2>
                            <p className="text-sm text-neutral-500 mb-6">
                                Watch how easy it is to manage your restaurant like a pro.
                            </p>
                            {/* Empty video placeholder */}
                            <div className="relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                                        <Play size={22} className="text-white ml-1" fill="white" />
                                    </div>
                                    <p className="text-white/60 text-xs font-medium">Video coming soon</p>
                                </div>
                                {/* Timer bar */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 flex items-center gap-2">
                                    <Play size={10} className="text-white" fill="white" />
                                    <span className="text-white text-[10px]">0:00 / 1:30</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing — right (3/5) */}
                        <div className="col-span-3">
                            <h2 className="text-2xl font-black text-neutral-900 mb-1 text-center">
                                Simple, Transparent Pricing
                            </h2>
                            <p className="text-sm text-neutral-500 mb-6 text-center">
                                Choose the plan that works best for your restaurant
                            </p>

                            <div className="grid grid-cols-3 gap-4" id="pricing">
                                {PLANS.map(plan => (
                                    <div key={plan.key} className="relative bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col hover:border-neutral-300 hover:shadow-sm transition-all">
                                        {/* Best value badge */}
                                        {plan.badge && (
                                            <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg rotate-12 shadow-sm">
                                                {plan.badge}
                                            </div>
                                        )}

                                        {/* Number */}
                                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black mb-3", plan.numColor)}>
                                            {plan.num}
                                        </div>

                                        <p className="text-sm font-black text-neutral-900">{plan.title}</p>
                                        <p className="text-xs text-neutral-400 mt-0.5 mb-4">{plan.subtitle}</p>

                                        {/* Price */}
                                        <div className="mb-1">
                                            <span className={cn("text-3xl font-black", plan.priceColor)}>
                                                {plan.price}
                                            </span>
                                            <span className="text-sm text-neutral-500 ml-1">{plan.priceSub}</span>
                                        </div>
                                        {plan.priceOld && (
                                            <p className="text-[11px] text-neutral-400 mb-4">{plan.priceOld}</p>
                                        )}
                                        {!plan.priceOld && <div className="mb-4" />}

                                        {/* Features */}
                                        <ul className="space-y-2 flex-1 mb-5">
                                            {plan.features.map(f => (
                                                <li key={f} className="flex items-center gap-2 text-xs text-neutral-600">
                                                    <Check size={13} className="text-green-500 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA */}
                                        {plan.key === "trial" ? (
                                            isSignedIn ? (
                                                <button
                                                    onClick={() => setStep("register")}
                                                    className={cn("w-full py-2.5 rounded-xl text-xs font-bold transition-colors", plan.btnClass)}
                                                >
                                                    {plan.btnLabel}
                                                </button>
                                            ) : (
                                                <SignUpButton mode="modal">
                                                    <button className={cn("w-full py-2.5 rounded-xl text-xs font-bold transition-colors", plan.btnClass)}>
                                                        {plan.btnLabel}
                                                    </button>
                                                </SignUpButton>
                                            )
                                        ) : (
                                            <button className={cn("w-full py-2.5 rounded-xl text-xs font-bold transition-colors", plan.btnClass)}>
                                                {plan.btnLabel}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="border-t border-neutral-100 py-10">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-4 gap-8">
                        {STATS.map(s => {
                            const Icon = s.icon;
                            return (
                                <div key={s.label} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                        <Icon size={18} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-neutral-900">{s.value}</p>
                                        <p className="text-xs text-neutral-500">{s.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Register Modal ── */}
            {step === "register" && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-indigo-600 px-8 py-7 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                                <Store size={22} className="text-white" />
                            </div>
                            <h2 className="text-xl font-black text-white">Create Your Restaurant</h2>
                            <p className="text-sm text-indigo-200 mt-1">
                                Signed in as {user?.emailAddresses[0]?.emailAddress}
                            </p>
                        </div>

                        <div className="px-8 py-6 space-y-4">
                            <div>
                                <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase block mb-2">
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
                            <div>
                                <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase block mb-2">
                                    URL Slug *
                                </label>
                                <div className="flex items-center border-2 border-neutral-200 focus-within:border-indigo-400 rounded-xl px-4 py-3 gap-2 transition-colors">
                                    <span className="text-sm text-neutral-400 shrink-0">servix.app/</span>
                                    <input
                                        value={form.slug}
                                        onChange={e => setForm(p => ({ ...p, slug: generateSlug(e.target.value) }))}
                                        placeholder="cairo-grill"
                                        className="flex-1 text-sm font-bold outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase block mb-2">
                                    Address (optional)
                                </label>
                                <input
                                    value={form.address}
                                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                    placeholder="123 Main St, Cairo"
                                    className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep("landing")}
                                    className="flex-1 py-3 rounded-xl border-2 border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={loading || !form.restaurantName.trim()}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading
                                        ? <><Loader2 size={15} className="animate-spin" /> Creating...</>
                                        : <><CheckCircle size={15} /> Create Restaurant</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <footer className="bg-neutral-900 text-white py-8 mt-0">
                <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <span className="text-white font-black text-xs">S</span>
                        </div>
                        <span className="font-black text-white">servix</span>
                    </div>
                    <p className="text-xs text-neutral-400">© 2025 Servix · All rights reserved</p>
                    <div className="flex gap-5">
                        {["Privacy", "Terms", "Support"].map(l => (
                            <a key={l} href="#" className="text-xs text-neutral-400 hover:text-white transition-colors">{l}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}