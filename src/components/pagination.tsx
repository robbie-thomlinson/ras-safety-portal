import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { pageHref, pageWindow, type Paginated } from "@/lib/pagination"
import { cn } from "@/lib/utils"

const count = new Intl.NumberFormat("en-CA")

// Plain links, so paging works before hydration, keeps the filters, and the back button steps through pages.
// Phones get Previous / "Page x of y" / Next; wider screens get numbered pages too.
export function Pagination({
  result: { page, pageSize, pageCount, total },
  pathname,
  searchParams,
  className,
}: {
  result: Paginated<unknown>
  pathname: string
  searchParams: Record<string, string | string[] | undefined>
  className?: string
}) {
  if (pageCount <= 1) return null

  const href = (p: number) => pageHref(pathname, searchParams, p)
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between", className)}
    >
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{count.format(first)}</span>–
        <span className="font-semibold text-foreground">{count.format(last)}</span> of{" "}
        <span className="font-semibold text-foreground">{count.format(total)}</span>
      </p>

      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
        <StepLink href={page > 1 ? href(page - 1) : null} label="Previous" icon={ChevronLeftIcon} />

        <span className="text-sm font-medium sm:hidden">
          Page {count.format(page)} of {count.format(pageCount)}
        </span>
        <ul className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, pageCount).map((p, i) => (
            <li key={p === "gap" ? `gap-${i}` : p}>
              {p === "gap" ? (
                <span className="flex size-9 items-center justify-center text-muted-foreground" aria-hidden>
                  …
                </span>
              ) : (
                <Button asChild variant={p === page ? "outline" : "ghost"} size="icon-lg" className="w-auto min-w-9 px-2">
                  <Link href={href(p)} aria-current={p === page ? "page" : undefined} aria-label={`Page ${p}`}>
                    {count.format(p)}
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>

        <StepLink href={page < pageCount ? href(page + 1) : null} label="Next" icon={ChevronRightIcon} iconEnd />
      </div>
    </nav>
  )
}

function StepLink({
  href,
  label,
  icon: Icon,
  iconEnd = false,
}: {
  href: string | null
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
      <Link href={href} aria-label={`${label} page`}>
        {content}
      </Link>
    </Button>
  )
}
