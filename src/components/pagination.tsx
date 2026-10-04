import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import type { MouseEvent } from "react"

import { Button } from "@/components/ui/button"
import { pageHref, pageWindow, type Paginated } from "@/lib/pagination"
import { cn } from "@/lib/utils"

const count = new Intl.NumberFormat("en-CA")

// Plain links, so paging works before hydration, keeps the filters, and the back button steps through pages.
// Phones get Previous / "Page x of y" / Next; wider screens get numbered pages too.
// A list that's already fully loaded passes onPageChange to page in place instead of navigating.
export function Pagination({
  result: { page, pageSize, pageCount, total },
  pathname,
  searchParams,
  onPageChange,
  className,
}: {
  result: Paginated<unknown>
  pathname: string
  searchParams: Record<string, string | string[] | undefined>
  onPageChange?: (page: number) => void
  className?: string
}) {
  if (pageCount <= 1) return null

  const href = (p: number) => pageHref(pathname, searchParams, p)
  // Modified clicks (new tab, new window) still follow the href.
  const onClick = (p: number) =>
    onPageChange &&
    ((e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      onPageChange(p)
    })
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{count.format(first)}</span>–
        <span className="font-semibold text-foreground">{count.format(last)}</span> of{" "}
        <span className="font-semibold text-foreground">{count.format(total)}</span>
      </p>

      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
        <StepLink
          href={page > 1 ? href(page - 1) : null}
          onClick={onClick(page - 1)}
          label="Previous"
          icon={ChevronLeftIcon}
        />

        <span className="text-sm font-medium sm:hidden">
          Page {count.format(page)} of {count.format(pageCount)}
        </span>
        <ul className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, pageCount).map((p, i) => (
            <li key={p === "gap" ? `gap-${i}` : p}>
              {p === "gap" ? (
                <span
                  className="flex size-9 items-center justify-center text-muted-foreground"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Button
                  asChild
                  variant={p === page ? "outline" : "ghost"}
                  size="icon-lg"
                  className="w-auto min-w-9 px-2"
                >
                  <Link
                    href={href(p)}
                    onClick={onClick(p)}
                    aria-current={p === page ? "page" : undefined}
                    aria-label={`Page ${p}`}
                  >
                    {count.format(p)}
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>

        <StepLink
          href={page < pageCount ? href(page + 1) : null}
          onClick={onClick(page + 1)}
          label="Next"
          icon={ChevronRightIcon}
          iconEnd
        />
      </div>
    </nav>
  )
}

function StepLink({
  href,
  onClick,
  label,
  icon: Icon,
  iconEnd = false,
}: {
  href: string | null
  onClick?: (e: MouseEvent) => void
  label: string
  icon: typeof ChevronLeftIcon
  iconEnd?: boolean
}) {
  const content = (
    <>
      {!iconEnd && <Icon data-icon="inline-start" />}
      {label}
      {iconEnd && <Icon data-icon="inline-end" />}
    </>
  )
  // Phones get a bigger tap target.
  const className = "h-11 px-4 sm:h-9 sm:px-2.5"

  // At either end the button stays put, disabled, so the controls don't shift.
  if (!href) {
    return (
      <Button variant="ghost" size="lg" className={className} disabled>
        {content}
      </Button>
    )
  }
  return (
    <Button asChild variant="ghost" size="lg" className={className}>
      <Link href={href} onClick={onClick} aria-label={`${label} page`}>
        {content}
      </Link>
    </Button>
  )
}
