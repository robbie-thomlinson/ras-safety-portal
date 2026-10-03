"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

// Ignore small wobbles so the header doesn't flicker mid-swipe.
const SCROLL_THRESHOLD = 8

// On phones the header slides away while scrolling down and comes back on any scroll up, like a
// mobile browser's address bar. It's still sticky, so nothing below it shifts. Desktop always shows it.
export function AutoHideHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY

    function onScroll() {
      // Clamp out iOS overscroll bounce, which would otherwise read as scrolling back up.
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      const y = Math.min(Math.max(window.scrollY, 0), maxY)
      const delta = y - lastY
      if (Math.abs(delta) < SCROLL_THRESHOLD) return
      // Never hide while any of the header's own spot at the top of the page is still on screen.
      setHidden(delta > 0 && y > (ref.current?.offsetHeight ?? 0))
      lastY = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      ref={ref}
      data-hidden={hidden || undefined}
      // Tabbing into a hidden header brings it back.
      onFocus={() => setHidden(false)}
      className={cn(
        "sticky top-0 z-40 motion-safe:transition-transform motion-safe:duration-200 max-md:data-hidden:-translate-y-full",
        className
      )}
    >
      {children}
    </header>
  )
}
