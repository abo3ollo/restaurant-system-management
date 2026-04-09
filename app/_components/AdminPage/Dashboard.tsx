import { cn } from "@/lib/utils";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Star,
    ArrowUpRight,
    ChevronRight,
} from "lucide-react";

const STATS = [
    {
        label: "Today's Revenue",
        value: "$4,280",
        change: "+12.5%",
        up: true,
        icon: DollarSign,
        color: "indigo",
    },
    {
        label: "Total Orders",
        value: "138",
        change: "+8.2%",
        up: true,
        icon: ShoppingBag,
        color: "emerald",
    },
    {
        label: "Avg. Order Value",
        value: "$31.0",
        change: "-2.1%",
        up: false,
        icon: TrendingUp,
        color: "amber",
    },
    {
        label: "Customer Rating",
        value: "4.8",
        change: "+0.2",
        up: true,
        icon: Star,
        color: "rose",
    },
];

const RECENT_ORDERS = [
    {
        id: "#1042",
        table: "Table 12",
        items: 4,
        amount: "$84.50",
        status: "Served",
        time: "2m ago",
    },
    {
        id: "#1041",
        table: "Table 07",
        items: 2,
        amount: "$42.00",
        status: "Preparing",
        time: "8m ago",
    },
    {
        id: "#1040",
        table: "Table 03",
        items: 6,
        amount: "$127.80",
        status: "Served",
        time: "15m ago",
    },
    {
        id: "#1039",
        table: "Table 09",
        items: 1,
        amount: "$16.00",
        status: "Paid",
        time: "22m ago",
    },
    {
        id: "#1038",
        table: "Table 15",
        items: 3,
        amount: "$58.20",
        status: "Paid",
        time: "31m ago",
    },
];

const TOP_ITEMS = [
    { name: "Truffle Dumplings", orders: 38, revenue: "$836" },
    { name: "Signature Old Fashioned", orders: 31, revenue: "$496" },
    { name: "Napolitan Margarita", orders: 27, revenue: "$486" },
    { name: "Molten Chocolate Cake", orders: 24, revenue: "$288" },
];

const STATUS_STYLE: Record<string, string> = {
    Served: "bg-emerald-100 text-emerald-700",
    Preparing: "bg-amber-100 text-amber-700",
    Paid: "bg-neutral-100 text-neutral-500",
};

const COLOR: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
};

export default function Dashboard() {
    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {STATS.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div
                            key={s.label}
                            className="bg-white rounded-2xl border border-neutral-100 p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center",
                                        COLOR[s.color],
                                    )}
                                >
                                    <Icon size={14} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-neutral-900">{s.value}</p>
                            <div
                                className={cn(
                                    "flex items-center gap-1 mt-1",
                                    s.up ? "text-emerald-600" : "text-red-500",
                                )}
                            >
                                {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                <span className="text-xs font-bold">
                                    {s.change} vs yesterday
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="col-span-2 bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide">
                            Recent Orders
                        </h3>
                        <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                            View all <ChevronRight size={12} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {RECENT_ORDERS.map((o) => (
                            <div
                                key={o.id}
                                className="flex items-center gap-4 py-2.5 border-b border-neutral-50 last:border-0"
                            >
                                <span className="text-xs font-black text-neutral-400 w-12">
                                    {o.id}
                                </span>
                                <span className="text-sm font-bold text-neutral-700 flex-1">
                                    {o.table}
                                </span>
                                <span className="text-xs text-neutral-400">
                                    {o.items} items
                                </span>
                                <span className="text-sm font-black text-neutral-800 w-16 text-right">
                                    {o.amount}
                                </span>
                                <span
                                    className={cn(
                                        "text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg uppercase",
                                        STATUS_STYLE[o.status],
                                    )}
                                >
                                    {o.status}
                                </span>
                                <span className="text-[11px] text-neutral-400 w-12 text-right">
                                    {o.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Items */}
                <div className="bg-white rounded-2xl border border-neutral-100 p-6">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wide mb-5">
                        Top Items
                    </h3>
                    <div className="flex flex-col gap-4">
                        {TOP_ITEMS.map((item, i) => (
                            <div key={item.name}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-neutral-300 w-4">
                                            {i + 1}
                                        </span>
                                        <span className="text-xs font-bold text-neutral-700">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-xs font-black text-neutral-800">
                                        {item.revenue}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-400 rounded-full transition-all"
                                        style={{ width: `${(item.orders / 40) * 100}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-1">
                                    {item.orders} orders
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 pt-5 border-t border-neutral-100">
                        <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">
                            Quick Actions
                        </p>
                        
                        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-xs font-bold text-neutral-600 hover:text-indigo-700 transition-all mb-1">
                            Add Menu Item <ArrowUpRight size={12} />
                        </button>
                        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-xs font-bold text-neutral-600 hover:text-indigo-700 transition-all mb-1">
                            Manage Tables <ArrowUpRight size={12} />
                        </button>
                        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-xs font-bold text-neutral-600 hover:text-indigo-700 transition-all mb-1">
                            Export Report <ArrowUpRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
