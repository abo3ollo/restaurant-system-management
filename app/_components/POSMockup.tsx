import { cn } from "@/lib/utils";

// ── Mock POS Screenshot ──
export default function POSMockup() {
    return (
        <div className="relative w-full h-full">
            <div className="absolute right-0 top-0 w-130 h-85 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <span className="text-white font-black text-[10px]">S</span>
                        </div>
                        <span className="text-sm font-black text-neutral-800">servix</span>
                    </div>
                    <div className="flex-1 mx-4">
                        <div className="bg-neutral-100 rounded-lg px-3 py-1 text-[11px] text-neutral-400">Search menu items...</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600 font-semibold">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">C</div>
                        Cashier
                    </div>
                </div>
                <div className="flex h-full">
                    <div className="w-36 border-r border-neutral-100 px-3 py-3 flex flex-col gap-1">
                        {["New Order", "Orders", "Tables"].map((item, i) => (
                            <div key={item} className={cn("px-3 py-2 rounded-xl text-[11px] font-bold", i === 2 ? "bg-indigo-50 text-indigo-700" : "text-neutral-500")}>
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 px-3 py-3">
                        <div className="flex gap-1 mb-3">
                            {["All", "Indoor", "Outdoor", "VIP"].map((t, i) => (
                                <span key={t} className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold", i === 0 ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-500")}>{t}</span>
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
                            <div className="flex justify-between text-[10px] font-black">
                                <span>Total</span><span>$33.48</span>
                            </div>
                        </div>
                        <button className="w-full mt-2 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black">Pay $33.48</button>
                    </div>
                </div>
            </div>
            <div className="absolute left-10 top-20 w-45 bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden" style={{ zIndex: 10 }}>
                <div className="bg-neutral-800 px-4 py-3 flex items-center justify-between">
                    <span className="text-white text-[10px] font-black">New Order</span>
                    <div className="w-4 h-4 rounded-full bg-neutral-600" />
                </div>
                <div className="px-3 py-2">
                    <div className="flex gap-1 mb-2">
                        {["All", "Pizza", "Drinks", "Desserts"].map((c, i) => (
                            <span key={c} className={cn("px-1.5 py-0.5 rounded-md text-[8px] font-bold", i === 0 ? "bg-indigo-600 text-white" : "text-neutral-400")}>{c}</span>
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
                    <button className="w-full py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black">View Cart (3) $29.00</button>
                </div>
            </div>
            <div className="absolute right-8 bottom-5 w-35 bg-white rounded-xl shadow-xl border border-neutral-200 p-3" style={{ zIndex: 10 }}>
                <div className="text-center mb-2">
                    <p className="text-[10px] font-black text-neutral-800">servix</p>
                    <p className="text-[8px] text-neutral-400">Order #00042</p>
                </div>
                <div className="border-t border-dashed border-neutral-200 pt-1.5">
                    <div className="flex justify-between text-[9px] font-black">
                        <span>Total</span><span>$33.48</span>
                    </div>
                </div>
                <p className="text-center text-[8px] text-neutral-400 mt-1.5">Thank you!</p>
            </div>
            <div className="absolute -right-2.5 bottom-7.5 w-24 h-16 bg-neutral-800 rounded-xl shadow-xl flex items-center justify-center" style={{ zIndex: 5 }}>
                <div className="w-16 h-3 bg-neutral-600 rounded-sm" />
            </div>
        </div>
    );
}