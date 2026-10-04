"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export type NavLink = { href: string; label: string }

export function NavLinks({ links, className }: { links: NavLink[]; className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {links.map(({ href, label }) => {
        const active =
          href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-primary-foreground/75 transition-colors hover:bg-white/10 hover:text-primary-foreground",
              active && "bg-white/15 text-primary-foreground",
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
