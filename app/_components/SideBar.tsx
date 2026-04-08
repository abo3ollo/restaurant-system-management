
import {
    LayoutDashboard,
    UtensilsCrossed,
    ClipboardList,
    BookOpen,
    BarChart2,
    Users,
    Settings,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";


export default function SideBar() {

    const NAV_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, active: false },
    { label: "Tables", icon: UtensilsCrossed, active: false },
    { label: "Orders", icon: ClipboardList, active: false },
    { label: "Menu", icon: BookOpen, active: true },
    { label: "Reports", icon: BarChart2, active: false },
    { label: "Users", icon: Users, active: false },
];
    return (
        <div>
            <aside className="w-55 shrink-0 bg-white border-r border-neutral-100 flex flex-col py-6 px-4">
                {/* Logo */}
                <div className="mb-8 px-2">
                    <p className="text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
                        The Architectural
                    </p>
                    <h1 className="text-xl font-black tracking-tight text-neutral-900 leading-tight">
                        POS
                    </h1>
                    <p className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase mt-0.5">
                        Tactile Workspace
                    </p>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1 flex-1">
                    {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
                        <button
                            key={label}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                active
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                            )}
                        >
                            <Icon
                                size={16}
                                className={active ? "text-indigo-600" : "text-neutral-400"}
                            />
                            {label.toUpperCase()}
                        </button>
                    ))}
                </nav>

                {/* Bottom nav */}
                <div className="flex flex-col gap-1 pt-4 border-t border-neutral-100">
                    {[
                        { label: "Settings", icon: Settings },
                        { label: "Support", icon: HelpCircle },
                    ].map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition-all"
                        >
                            <Icon size={16} />
                            {label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </aside>
        </div>
    )
}
