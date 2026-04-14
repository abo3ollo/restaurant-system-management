"use client"

import { Button } from '@/components/ui/button';
import { SignInButton, SignUpButton, useAuth, UserButton } from '@clerk/nextjs'
import { Stethoscope, X, Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react'

export default function Navbar() {
  const { isSignedIn } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/admin", label: "Admin" },
    { href: "/cashier", label: "Cashier" },
    { href: "/waiter", label: "Waiter" },

  ]

  return (
    <nav className="sticky top-0 z-50 bg-background/80 border-border border-b backdrop-blur-md">
      <div className='container mx-auto px-4 h-16 flex items-center justify-between gap-4'>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-foreground text-2xl font-bold shrink-0">
          <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center">
                                <span className="text-white font-black text-lg leading-none">f</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-neutral-900">foodics</h1>
                        </div>
        </Link>

        {/* Desktop Nav Links */}
        {/* <ul className="hidden lg:flex items-center gap-10 list-none m-0 flex-1 justify-center">
          {navLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-foreground text-base font-medium transition-colors duration-200 hover:text-foreground/60"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul> */}

        {/* Auth Buttons */}
        <div className='flex items-center gap-3 shrink-0'>
          {isSignedIn ? (
            <UserButton  />
          ) : (
            <div className='hidden lg:flex gap-2'>
              <SignInButton mode='modal'>
                <Button variant="ghost" size="sm">Login</Button>
              </SignInButton>
              <SignUpButton mode='modal'>
                <Button size="sm">Signup</Button>
              </SignUpButton>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-4 flex flex-col gap-1">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-foreground text-base font-medium py-3 px-3 rounded-md hover:bg-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {/* Auth in mobile menu (only when signed out) */}
          {!isSignedIn && (
            <div className='flex gap-2 mt-3 pt-3 border-t border-border'>
              <SignInButton mode='modal'>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setMenuOpen(false)}>
                  Login
                </Button>
              </SignInButton>
              <SignUpButton mode='modal'>
                <Button size="sm" className="flex-1" onClick={() => setMenuOpen(false)}>
                  Signup
                </Button>
              </SignUpButton>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}