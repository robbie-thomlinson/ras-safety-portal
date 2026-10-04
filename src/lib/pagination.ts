// Numbered, offset-based pagination driven by a `?page=` search param, shared by every list that can grow.

export const DEFAULT_PAGE_SIZE = 25

export type PageRequest = { page: number; pageSize: number }

export type Paginated<T> = PageRequest & { items: T[]; total: number; pageCount: number }

type SearchParams = Record<string, string | string[] | undefined>

// A missing or hand-edited page number falls back to the first page rather than an error.
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !/^\d+$/.test(raw)) return 1
  return Math.max(1, Number(raw))
}

// Inclusive row bounds, as Supabase's .range() takes them.
export function pageRange({ page, pageSize }: PageRequest): [from: number, to: number] {
  const from = (page - 1) * pageSize
  return [from, from + pageSize - 1]
}

export function paginated<T>(items: T[], total: number, { page, pageSize }: PageRequest): Paginated<T> {
  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) }
}

// The page numbers to show: always the first and last, plus a window around the current page,
// with "gap" where pages are skipped. Gaps of a single page show that page instead.
export function pageWindow(page: number, pageCount: number, siblings = 1): (number | "gap")[] {
  const pages = new Set([1, pageCount])
  for (let p = page - siblings; p <= page + siblings; p++) if (p >= 1 && p <= pageCount) pages.add(p)

  const sorted = [...pages].filter((p) => p >= 1).sort((a, b) => a - b)
  const out: (number | "gap")[] = []
  for (const p of sorted) {
    const prev = out.at(-1)
    if (typeof prev === "number" && p - prev === 2) out.push(prev + 1)
    else if (typeof prev === "number" && p - prev > 2) out.push("gap")
    out.push(p)
  }
  return out
}

// Keeps the other params (filters) and leaves page 1 off, so the first page has one canonical URL.
export function pageHref(pathname: string, params: SearchParams, page: number): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v)
  }
  if (page > 1) search.set("page", String(page))
  return search.size ? `${pathname}?${search}` : pathname
}
