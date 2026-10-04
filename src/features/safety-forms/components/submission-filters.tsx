"use client"

import { XIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

import { DateRangePicker } from "@/components/date-range-picker"
import { SearchSelect, type SearchSelectOption } from "@/components/search-select"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

import type { FormFilters } from "../schemas"

type Option = { id: string | number; name: string }

// Filters live in the URL, so a filtered list can be bookmarked or shared and the server does the filtering.
export function SubmissionFilters({
  filters,
  sites,
  workers,
  today,
}: {
  filters: FormFilters
  sites: { id: number; name: string; archivedAt: string | null }[]
  workers: Option[]
  today: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  function update(changes: Partial<Record<keyof FormFilters, string | undefined>>) {
    const params = new URLSearchParams()
    const next = { ...filters, ...changes }
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, String(value))
    startTransition(() => router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false }))
  }

  const active = Object.values(filters).some(Boolean)
  // Active sites first, then archived ones (still searchable for their past forms), each alphabetical.
  const siteOptions: SearchSelectOption[] = [...sites]
    .sort((a, b) => Number(!!a.archivedAt) - Number(!!b.archivedAt))
    .map((site) => ({ id: site.id, name: site.name, tag: site.archivedAt ? "Archived" : undefined }))

  return (
    <section
      aria-labelledby="filters-heading"
      className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4 transition-opacity", pending && "opacity-60")}
    >
      {/* Fixed height so "Clear all" appearing doesn't nudge the filters down. */}
      <div className="flex h-6 items-center justify-between">
        <h2 id="filters-heading" className="font-sans text-sm font-semibold">
          Filters
        </h2>
        {active && (
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
          >
            {/* Nunito's capitals sit high in the line box, so a centered icon reads ~1px low at this size. */}
            <XIcon data-icon="inline-start" className="-translate-y-px" />
            Clear all
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[14rem_1fr_1fr_1fr]">
        <Field className="col-span-2 lg:col-span-1">
          <FieldLabel htmlFor="filter-date">Date</FieldLabel>
          <DateRangePicker
            id="filter-date"
            value={{ from: filters.from, to: filters.to }}
            onChange={({ from, to }) => update({ from, to })}
            today={today}
            className="w-full"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-site">Job site</FieldLabel>
          <SearchSelect
            id="filter-site"
            placeholder="All sites"
            value={filters.jobSiteId}
            options={siteOptions}
            onChange={(jobSiteId) => update({ jobSiteId })}
            className="w-full"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-worker">Worker</FieldLabel>
          <SearchSelect
            id="filter-worker"
            placeholder="All workers"
            value={filters.workerId}
            options={workers}
            onChange={(workerId) => update({ workerId })}
            className="w-full"
          />
        </Field>
        <FilterSelect
          id="filter-status"
          label="Status"
          className="col-span-2 lg:col-span-1"
          allLabel="Any status"
          value={filters.status}
          options={[
            { id: "submitted", name: "Awaiting review" },
            { id: "reviewed", name: "Reviewed" },
          ]}
          onChange={(status) => update({ status })}
        />
      </div>
    </section>
  )
}

function FilterSelect({
  id,
  label,
  allLabel,
  value,
  options,
  onChange,
  className,
}: {
  id: string
  label: string
  className?: string
  allLabel: string
  value: string | number | undefined
  options: Option[]
  onChange: (value: string | undefined) => void
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        id={id}
        className="w-full [&>select]:h-9"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <NativeSelectOption value="">{allLabel}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.id} value={option.id}>
            {option.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}
