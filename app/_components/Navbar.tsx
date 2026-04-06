"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link";

const triggerClass = "text-sm font-medium text-foreground hover:text-primary transition-colors px-4 py-2 rounded-md hover:bg-accent outline-none"

export default function Navbar() {

  const navLinks = [
    {
      label: "البيانات الاساسية", details: [
        { label: "تعريف الخدمات", href: "/البيانات-الاساسية/تعريف-الخدمات" },
        { label: "أنواع الخدمات", href: "/البيانات-الاساسية/أنواع-الخدمات" },
      ]
    },
    { label: "المخازن", details: [] },
    { label: "التكاليف", details: [] },
    {
      label: "الرواتب", details: [
        { label: "الموظفين", href: "/الرواتب/الموظفين" },
      ]
    },
    { label: "الصلاحيات", details: [] },
    { label: "اعدادات", details: [] },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-background/80 border-border border-b backdrop-blur-md">
      <div className='container mx-auto px-4 h-16 flex items-center justify-between gap-4'>

        <ul className="hidden lg:flex items-center gap-10 list-none m-0 flex-1 justify-center">
          {navLinks.map((item) => (
            <li key={item.label}>
              {item.details.length > 0 ? (
                <DropdownMenu>
                  {/* ✅ مفيش Button جوا — الـ trigger نفسه هو الـ button */}
                  <DropdownMenuTrigger className={triggerClass}>
                    {item.label}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-36">
                    <DropdownMenuGroup>
                      {item.details.map((detail, idx) => (
                        <DropdownMenuItem key={idx} >
                          <Link href={detail.href} className="cursor-pointer  py-3 px-2">
                            {detail.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button className={triggerClass}>
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>

      </div>
    </nav>
  );
}