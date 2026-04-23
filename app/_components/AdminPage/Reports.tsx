"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import ShiftsReport from "./ShiftsReport";
import AnalyticsReport from "./AnalyticsReport";



export default function Reports() {
    const [reportTab, setReportTab] = useState<"analytics" | "shifts">("analytics");


    return (
        <>
            <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 w-fit mb-6">
                <button
                    onClick={() => setReportTab("analytics")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                        reportTab === "analytics"
                            ? "bg-white text-neutral-900 shadow-sm"
                            : "text-neutral-400 hover:text-neutral-600"
                    )}
                >
                    Analytics
                </button>
                <button
                    onClick={() => setReportTab("shifts")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                        reportTab === "shifts"
                            ? "bg-white text-neutral-900 shadow-sm"
                            : "text-neutral-400 hover:text-neutral-600"
                    )}
                >
                    Shifts
                </button>
            </div>
            {reportTab === "analytics" && <AnalyticsReport/>}
            {reportTab === "shifts" && <ShiftsReport />}
        </>
    );
}