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
import POSMockup from "./_components/POSMockup";

// ── Types ──
type PlanKey = "trial" | "monthly" | "yearly";
type Lang = "en" | "ar";
type Currency = "EGP" | "USD" | "SAR" | "AED";

// ── Currency config ──
const CURRENCY_CONFIG: Record<Currency, {
    symbol: string;
    label: string;
    monthly: number;
    yearly: number;
    monthlyOld: number;
    yearlyOld: number;
}> = {
    EGP: { symbol: "EGP", label: "EGP (ج.م)", monthly: 800, yearly: 14400, monthlyOld: 1500, yearlyOld: 18000 },
    USD: { symbol: "$", label: "USD ($)", monthly: 16, yearly: 288, monthlyOld: 30, yearlyOld: 360 },
    SAR: { symbol: "SAR", label: "SAR (ر.س)", monthly: 60, yearly: 1080, monthlyOld: 112, yearlyOld: 1350 },
    AED: { symbol: "AED", label: "AED (د.إ)", monthly: 59, yearly: 1060, monthlyOld: 110, yearlyOld: 1325 },
};

// ── Translations ──
const T = {
    en: {
        dir: "ltr" as const,
        nav: {
            getStarted: "Get Started",
        },
        hero: {
            badge: "All-in-One Restaurant Management System",
            title1: "Run Your Restaurant",
            title2: "Smarter, Faster,",
            titleHighlight: "Easier",
            desc: "Manage orders, tables, staff, menu, payments, and reports — all in one powerful and simple system.",
            cta: "Start Free 7-Day Trial",
            watchDemo: "Watch Demo",
            noCreditCard: "No credit card required • Setup in less than 5 minutes",
        },
        features: [
            { label: "Smart Orders", desc: "Real-time order management" },
            { label: "Table Management", desc: "Track and manage your tables" },
            { label: "Easy Payments", desc: "Cash, card, and receipts" },
            { label: "Reports & Analytics", desc: "Daily insights to grow your business" },
        ],
        demo: {
            title: "See Servix in Action",
            desc: "Watch how easy it is to manage your restaurant like a pro.",
            videoSoon: "Video coming soon",
        },
        pricing: {
            title: "Simple, Transparent Pricing",
            desc: "Choose the plan that works best for your restaurant",
            plans: {
                trial: { title: "Free Trial", subtitle: "Try all features free for 7 days", price: "7 Days", priceSub: "Free", btn: "Start Free Trial" },
                monthly: { title: "Monthly Plan", subtitle: "Perfect for growing restaurants", btn: "Get Started Monthly" },
                yearly: { title: "Yearly Plan", subtitle: "Best value for your business", btn: "Get Started Yearly", badge: "Best Value" },
            },
            features: {
                trial: ["All Features Included", "No Credit Card Required", "Cancel Anytime"],
                monthly: ["All Features Included", "Priority Support", "Regular Updates"],
                yearly: ["All Features Included", "Priority Support", "Save 20% off", "Regular Updates"],
            },
            insteadOf: "instead of",
        },
        stats: [
            { value: "500+", label: "Restaurants Trust Us" },
            { value: "99.9%", label: "Uptime & Reliability" },
            { value: "24/7", label: "Customer Support" },
            { value: "Secure", label: "Your Data is Safe" },
        ],
        register: {
            title: "Create Your Restaurant",
            signedInAs: "Signed in as",
            namePlaceholder: "e.g. Cairo Grill",
            slugPlaceholder: "cairo-grill",
            addressPlaceholder: "123 Main St, Cairo",
            nameLabel: "Restaurant Name *",
            slugLabel: "URL Slug *",
            addressLabel: "Address (optional)",
            cancel: "Cancel",
            create: "Create Restaurant",
            creating: "Creating...",
        },
        footer: { rights: "© 2025 Servix · All rights reserved", links: ["Privacy", "Terms", "Support"] },
    },
    ar: {
        dir: "rtl" as const,
        nav: {
            getStarted: "ابدأ الآن",
        },
        hero: {
            badge: "نظام إدارة المطاعم المتكامل",
            title1: "أدر مطعمك",
            title2: "بشكل أذكى، أسرع،",
            titleHighlight: "أسهل",
            desc: "إدارة الطلبات والطاولات والموظفين والقائمة والمدفوعات والتقارير — كل شيء في نظام واحد قوي وبسيط.",
            cta: "ابدأ التجربة المجانية 7 أيام",
            watchDemo: "شاهد العرض",
            noCreditCard: "لا بطاقة ائتمانية مطلوبة • الإعداد في أقل من 5 دقائق",
        },
        features: [
            { label: "طلبات ذكية", desc: "إدارة الطلبات في الوقت الفعلي" },
            { label: "إدارة الطاولات", desc: "تتبع وإدارة طاولاتك" },
            { label: "مدفوعات سهلة", desc: "نقداً وبطاقة وإيصالات" },
            { label: "تقارير وتحليلات", desc: "رؤى يومية لتنمية أعمالك" },
        ],
        demo: {
            title: "شاهد Servix في العمل",
            desc: "شاهد كيف يمكنك إدارة مطعمك مثل المحترفين.",
            videoSoon: "الفيديو قريباً",
        },
        pricing: {
            title: "أسعار بسيطة وشفافة",
            desc: "اختر الخطة المناسبة لمطعمك",
            plans: {
                trial: { title: "تجربة مجانية", subtitle: "جرب جميع المميزات مجاناً لمدة 7 أيام", price: "7 أيام", priceSub: "مجاناً", btn: "ابدأ التجربة المجانية" },
                monthly: { title: "خطة شهرية", subtitle: "مثالية للمطاعم النامية", btn: "ابدأ الخطة الشهرية" },
                yearly: { title: "خطة سنوية", subtitle: "أفضل قيمة لأعمالك", btn: "ابدأ الخطة السنوية", badge: "الأفضل قيمة" },
            },
            features: {
                trial: ["جميع المميزات مشمولة", "لا بطاقة ائتمانية مطلوبة", "إلغاء في أي وقت"],
                monthly: ["جميع المميزات مشمولة", "دعم أولوي", "تحديثات منتظمة"],
                yearly: ["جميع المميزات مشمولة", "دعم أولوي", "وفر 20%", "تحديثات منتظمة"],
            },
            insteadOf: "بدلاً من",
        },
        stats: [
            { value: "+500", label: "مطعم يثق بنا" },
            { value: "99.9%", label: "وقت تشغيل وموثوقية" },
            { value: "24/7", label: "دعم العملاء" },
            { value: "آمن", label: "بياناتك في أمان" },
        ],
        register: {
            title: "أنشئ مطعمك",
            signedInAs: "مسجل دخول بـ",
            namePlaceholder: "مثال: مطعم القاهرة",
            slugPlaceholder: "cairo-grill",
            addressPlaceholder: "123 شارع رئيسي، القاهرة",
            nameLabel: "اسم المطعم *",
            slugLabel: "رابط المطعم *",
            addressLabel: "العنوان (اختياري)",
            cancel: "إلغاء",
            create: "إنشاء المطعم",
            creating: "جاري الإنشاء...",
        },
        footer: { rights: "© 2025 Servix · جميع الحقوق محفوظة", links: ["الخصوصية", "الشروط", "الدعم"] },
    },
};


// ── Dropdown ──────────────────────────────────────────
function Dropdown<T extends string>({
    options, value, onChange, renderLabel,
}: {
    options: T[];
    value: T;
    onChange: (v: T) => void;
    renderLabel: (v: T) => string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
                {renderLabel(value)}
                <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden min-w-32">
                    {options.map(o => (
                        <button
                            key={o}
                            onClick={() => { onChange(o); setOpen(false); }}
                            className={cn(
                                "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50",
                                value === o ? "font-bold text-indigo-600 bg-indigo-50" : "text-neutral-600"
                            )}
                        >
                            {renderLabel(o)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Component ──────────────────────────────────
export default function ServixLanding() {
    const router = useRouter();
    const { isSignedIn, isLoaded, user } = useUser();
    const currentUser = useQuery(api.users.getCurrentUser);
    const createRestaurant = useMutation(api.restaurants.createRestaurant);

    const [step, setStep] = useState<"landing" | "register">("landing");
    const [form, setForm] = useState({ restaurantName: "", slug: "", address: "", phone: "" });
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState<Lang>("en");
    const [currency, setCurrency] = useState<Currency>("EGP");

    const t = T[lang];
    const cur = CURRENCY_CONFIG[currency];

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const handleNameChange = (name: string) => {
        setForm(p => ({ ...p, restaurantName: name, slug: generateSlug(name) }));
    };

    const formatPrice = (n: number) => {
        if (Number.isInteger(n)) return n.toLocaleString();
        return n.toFixed(0);
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

    const FEATURE_ICONS = [ShoppingBag, LayoutGrid, CreditCard, BarChart2];

    return (
        <div
            className="min-h-screen bg-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
            dir={t.dir}
        >
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


                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        {/* Language dropdown */}
                        <Dropdown
                            options={["en", "ar"] as Lang[]}
                            value={lang}
                            onChange={setLang}
                            renderLabel={v => v === "en" ? " English" : " العربية"}
                        />

                        {/* Currency dropdown */}
                        <Dropdown
                            options={["EGP", "USD", "SAR", "AED"] as Currency[]}
                            value={currency}
                            onChange={setCurrency}
                            renderLabel={v => CURRENCY_CONFIG[v].label}
                        />

                        {/* CTA */}
                        {isSignedIn ? (
                            <button onClick={() => setStep("register")}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm shadow-indigo-200">
                                {t.nav.getStarted}
                            </button>
                        ) : (
                            <SignUpButton mode="modal">
                                <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm shadow-indigo-200">
                                    {t.nav.getStarted}
                                </button>
                            </SignUpButton>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="max-w-7xl mx-auto px-8 pt-16 pb-8">
                <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-12 items-center">
                    {/* Left */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-xs font-semibold text-indigo-700">{t.hero.badge}</span>
                        </div>

                        <h1 className="text-5xl font-black text-neutral-900 leading-[1.1] mb-5">
                            {t.hero.title1}
                            <br />
                            {t.hero.title2}{" "}
                            <span className="text-indigo-600">{t.hero.titleHighlight}</span>
                        </h1>

                        <p className="text-lg text-neutral-500 leading-relaxed mb-8 max-w-md">
                            {t.hero.desc}
                        </p>

                        {/* Features grid */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-10">
                            {t.features.map((f, i) => {
                                const Icon = FEATURE_ICONS[i];
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
                                <button onClick={() => setStep("register")}
                                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-200">
                                    {t.hero.cta} <ArrowRight size={16} />
                                </button>
                            ) : (
                                <SignUpButton mode="modal">
                                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-200">
                                        {t.hero.cta} <ArrowRight size={16} />
                                    </button>
                                </SignUpButton>
                            )}
                            <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-neutral-200 hover:border-neutral-300 text-neutral-700 font-bold text-sm transition-colors">
                                <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center">
                                    <Play size={10} className="text-white ml-0.5" fill="white" />
                                </div>
                                {t.hero.watchDemo}
                            </button>
                        </div>

                        <p className="text-xs text-neutral-400 mt-4 flex items-center gap-1.5">
                            <Shield size={12} className="text-green-500" />
                            {t.hero.noCreditCard}
                        </p>
                    </div>

                    {/* Right — POS mockup */}
                    <div className="relative h-95 hidden md:block">
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
            <section className="bg-neutral-50 border-y border-neutral-100 py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
                        {/* Demo */}
                        <div className="lg:col-span-2">
                            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 mb-1">{t.demo.title}</h2>
                            <p className="text-sm text-neutral-500 mb-6">{t.demo.desc}</p>
                            <div className="relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                                        <Play size={18} className="text-white ml-0.5 sm:w-5 sm:h-5" fill="white" />
                                    </div>
                                    <p className="text-white/60 text-[10px] sm:text-xs font-medium">{t.demo.videoSoon}</p>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-2">
                                    <Play size={8} className="text-white sm:w-2.5 sm:h-2.5" fill="white" />
                                    <span className="text-white text-[8px] sm:text-[10px]">0:00 / 1:30</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="lg:col-span-3">
                            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 mb-1 text-center">{t.pricing.title}</h2>
                            <p className="text-sm text-neutral-500 mb-6 sm:mb-8 text-center">{t.pricing.desc}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                {/* Trial */}
                                <div className="relative bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 flex flex-col hover:shadow-lg transition-all">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-black mb-3">1</div>
                                    <p className="text-sm font-black text-neutral-900">{t.pricing.plans.trial.title}</p>
                                    <p className="text-xs text-neutral-400 mt-0.5 mb-3 sm:mb-4">{t.pricing.plans.trial.subtitle}</p>
                                    <div className="mb-3 sm:mb-4">
                                        <span className="text-2xl sm:text-3xl font-black text-neutral-900">{t.pricing.plans.trial.price}</span>
                                        <span className="text-xs sm:text-sm text-neutral-500 ml-1">{t.pricing.plans.trial.priceSub}</span>
                                    </div>
                                    <ul className="space-y-2 flex-1 mb-4 sm:mb-5">
                                        {t.pricing.features.trial.map(f => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-neutral-600">
                                                <Check size={12} className="text-green-500 shrink-0" />{f}
                                            </li>
                                        ))}
                                    </ul>
                                    {isSignedIn ? (
                                        <button onClick={() => setStep("register")}
                                            className="w-full py-2 sm:py-2.5 rounded-xl text-xs font-bold border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-colors">
                                            {t.pricing.plans.trial.btn}
                                        </button>
                                    ) : (
                                        <SignUpButton mode="modal">
                                            <button className="w-full py-2 sm:py-2.5 rounded-xl text-xs font-bold border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-colors">
                                                {t.pricing.plans.trial.btn}
                                            </button>
                                        </SignUpButton>
                                    )}
                                </div>

                                {/* Monthly */}
                                <div className="relative bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 flex flex-col hover:shadow-lg transition-all">
                                    <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-sm font-black mb-3">2</div>
                                    <p className="text-sm font-black text-neutral-900">{t.pricing.plans.monthly.title}</p>
                                    <p className="text-xs text-neutral-400 mt-0.5 mb-3 sm:mb-4">{t.pricing.plans.monthly.subtitle}</p>
                                    <div className="mb-1">
                                        <span className="text-2xl sm:text-3xl font-black text-neutral-900">
                                            {cur.symbol} {formatPrice(cur.monthly)}
                                        </span>
                                        <span className="text-xs sm:text-sm text-neutral-500 ml-1">/ {lang === "ar" ? "شهر" : "month"}</span>
                                    </div>
                                    <p className="text-[10px] sm:text-[11px] text-neutral-400 mb-3 sm:mb-4">
                                        ({t.pricing.insteadOf} {cur.symbol} {formatPrice(cur.monthlyOld)})
                                    </p>
                                    <ul className="space-y-2 flex-1 mb-4 sm:mb-5">
                                        {t.pricing.features.monthly.map(f => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-neutral-600">
                                                <Check size={12} className="text-green-500 shrink-0" />{f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="w-full py-2 sm:py-2.5 rounded-xl text-xs font-bold border-2 border-green-500 text-green-600 hover:bg-green-50 transition-colors">
                                        {t.pricing.plans.monthly.btn}
                                    </button>
                                </div>

                                {/* Yearly */}
                                <div className="relative bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 flex flex-col hover:shadow-lg transition-all sm:col-span-2 lg:col-span-1">
                                    <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-orange-500 text-white text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg rotate-12 shadow-sm">
                                        {t.pricing.plans.yearly.badge}
                                    </div>
                                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-sm font-black mb-3">3</div>
                                    <p className="text-sm font-black text-neutral-900">{t.pricing.plans.yearly.title}</p>
                                    <p className="text-xs text-neutral-400 mt-0.5 mb-3 sm:mb-4">{t.pricing.plans.yearly.subtitle}</p>
                                    <div className="mb-1">
                                        <span className="text-2xl sm:text-3xl font-black text-neutral-900">
                                            {cur.symbol} {formatPrice(cur.yearly)}
                                        </span>
                                        <span className="text-xs sm:text-sm text-neutral-500 ml-1">/ {lang === "ar" ? "سنة" : "year"}</span>
                                    </div>
                                    <p className="text-[10px] sm:text-[11px] text-neutral-400 mb-3 sm:mb-4">
                                        ({t.pricing.insteadOf} {cur.symbol} {formatPrice(cur.yearlyOld)})
                                    </p>
                                    <ul className="space-y-2 flex-1 mb-4 sm:mb-5">
                                        {t.pricing.features.yearly.map(f => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-neutral-600">
                                                <Check size={12} className="text-green-500 shrink-0" />{f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="w-full py-2 sm:py-2.5 rounded-xl text-xs font-bold border-2 border-orange-400 text-orange-500 hover:bg-orange-50 transition-colors">
                                        {t.pricing.plans.yearly.btn}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="border-t border-neutral-100 py-10">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-4 gap-8">
                        {t.stats.map((s, i) => {
                            const icons = [Star, Shield, Phone, Shield];
                            const Icon = icons[i];
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
                            <h2 className="text-xl font-black text-white">{t.register.title}</h2>
                            <p className="text-sm text-indigo-200 mt-1">
                                {t.register.signedInAs} {user?.emailAddresses[0]?.emailAddress}
                            </p>
                        </div>
                        <div className="px-8 py-6 space-y-4">
                            <div>
                                <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">{t.register.nameLabel}</label>
                                <input value={form.restaurantName} onChange={e => handleNameChange(e.target.value)}
                                    placeholder={t.register.namePlaceholder}
                                    className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">{t.register.slugLabel}</label>
                                <div className="flex items-center border-2 border-neutral-200 focus-within:border-indigo-400 rounded-xl px-4 py-3 gap-2 transition-colors">
                                    <span className="text-sm text-neutral-400 shrink-0">servix.app/</span>
                                    <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: generateSlug(e.target.value) }))}
                                        placeholder={t.register.slugPlaceholder}
                                        className="flex-1 text-sm font-bold outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold tracking-widests text-neutral-400 uppercase block mb-2">{t.register.addressLabel}</label>
                                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                    placeholder={t.register.addressPlaceholder}
                                    className="w-full border-2 border-neutral-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep("landing")}
                                    className="flex-1 py-3 rounded-xl border-2 border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
                                    {t.register.cancel}
                                </button>
                                <button onClick={handleCreate} disabled={loading || !form.restaurantName.trim()}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading
                                        ? <><Loader2 size={15} className="animate-spin" /> {t.register.creating}</>
                                        : <><CheckCircle size={15} /> {t.register.create}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <footer className="bg-neutral-900 text-white py-8">
                <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <span className="text-white font-black text-xs">S</span>
                        </div>
                        <span className="font-black text-white">servix</span>
                    </div>
                    <p className="text-xs text-neutral-400">{t.footer.rights}</p>
                    <div className="flex gap-5">
                        {t.footer.links.map(l => (
                            <a key={l} href="#" className="text-xs text-neutral-400 hover:text-white transition-colors">{l}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}