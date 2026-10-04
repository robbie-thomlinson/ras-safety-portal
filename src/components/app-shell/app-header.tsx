import Image from "next/image"
import Link from "next/link"

import type { CurrentUser } from "@/features/auth/data"

import { AutoHideHeader } from "./auto-hide-header"
import { NavLinks, type NavLink } from "./nav-links"
import { UserMenu } from "./user-menu"

const LINKS: Record<CurrentUser["role"], NavLink[]> = {
  framer: [
    { href: "/", label: "Home" },
    { href: "/submissions", label: "My forms" },
  ],
  admin: [
    { href: "/", label: "Dashboard" },
    { href: "/submissions", label: "Submissions" },
    { href: "/sites", label: "Job sites" },
  ],
}

export function AppHeader({ user }: { user: CurrentUser }) {
  const links = LINKS[user.role]

  return (
    <AutoHideHeader className="bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/brand/ras-mark-white.png" alt="RAS" width={48} height={32} priority className="h-7 w-auto" />
          <span className="font-heading text-lg font-semibold tracking-wide uppercase">Site Safety</span>
        </Link>
        <NavLinks links={links} className="hidden md:flex" />
        <div className="ml-auto">
          <UserMenu user={user} />
        </div>
      </div>
      {/* On phones the links get their own row; the whole header tucks away on scroll to give it back. */}
      <div className="border-t border-white/10 md:hidden">
        <NavLinks links={links} className="mx-auto max-w-6xl overflow-x-auto px-2 py-1.5" />
      </div>
    </AutoHideHeader>
  )
}
