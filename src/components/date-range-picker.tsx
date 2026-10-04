"use client"

import { CalendarIcon, CheckIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"
import type { DateRange as CalendarRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  dateRangePresets,
  formatDate,
  formatDateRange,
  fromCalendarDate,
  matchDateRangePreset,
  toCalendarDate,
} from "@/lib/dates"
import { cn } from "@/lib/utils"

export type DateRange = { from?: string; to?: string }

// Most searches are "today" or "this week", so those are one tap; a calendar is there for anything else.
export function DateRangePicker({
  id,
  value,
  onChange,
  today,
  className,
}: {
  id?: string
  value: DateRange
  onChange: (range: DateRange) => void
  today: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<"presets" | "custom">("presets")
  const [draft, setDraft] = useState<CalendarRange | undefined>()

  const { from, to } = value
  const presets = dateRangePresets(today)
  const activePreset = matchDateRangePreset(today, from, to)
  const isCustom = Boolean(from || to) && !activePreset
  const label = rangeLabel(value, today)

  function choose(range: DateRange) {
    onChange(range)
    setOpen(false)
  }

  function showCalendar() {
    setDraft(
      from || to
        ? { from: toCalendarDate(from ?? to!), to: to ? toCalendarDate(to) : undefined }
        : undefined,
    )
    setView("custom")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setView("presets")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "h-9 justify-start bg-transparent font-normal",
            !label && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          <span className="truncate">{label ?? "Any time"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-72 gap-0", view === "presets" ? "p-1" : "p-0")}
      >
        {view === "presets" ? (
          <div className="flex flex-col">
            <PresetButton active={!from && !to} onClick={() => choose({})}>
              Any time
            </PresetButton>
            {presets.map((preset) => (
              <PresetButton
                key={preset.id}
                active={activePreset?.id === preset.id}
                hint={formatDateRange(preset.from, preset.to, today.slice(0, 4))}
                onClick={() => choose({ from: preset.from, to: preset.to })}
              >
                {preset.label}
              </PresetButton>
            ))}
            <Separator className="my-1" />
            <PresetButton active={isCustom} onClick={showCalendar}>
              Custom range
              <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
                {isCustom && label}
                <ChevronRightIcon />
              </span>
            </PresetButton>
          </div>
        ) : (
          <div className="flex flex-col">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              resetOnSelect
              weekStartsOn={1}
              defaultMonth={draft?.to ?? draft?.from ?? toCalendarDate(today)}
              disabled={{ after: toCalendarDate(today) }}
              className="w-full!"
            />
            <div className="flex items-center justify-between gap-3 border-t p-2">
              <span className="text-sm">
                {!draft?.from ? (
                  <span className="text-muted-foreground">Pick a start date</span>
                ) : draft.to ? (
                  <span className="font-medium">
                    {formatCalendarRange(draft.from, draft.to, today)}
                  </span>
                ) : (
                  <>
                    <span className="font-medium">
                      {formatCalendarRange(draft.from, draft.from, today)}
                    </span>
                    <span className="text-muted-foreground"> – pick an end date</span>
                  </>
                )}
              </span>
              <Button
                size="lg"
                disabled={!draft?.from}
                onClick={() =>
                  draft?.from &&
                  choose({
                    from: fromCalendarDate(draft.from),
                    to: fromCalendarDate(draft.to ?? draft.from),
                  })
                }
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function PresetButton({
  active,
  hint,
  onClick,
  children,
}: {
  active: boolean
  hint?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-2 rounded-md px-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 md:h-9 [&_svg]:size-4 [&_svg]:shrink-0",
        active && "font-semibold",
      )}
    >
      <CheckIcon className={cn("text-primary", !active && "invisible")} />
      {children}
      {hint && <span className="ml-auto text-xs font-normal text-muted-foreground">{hint}</span>}
    </button>
  )
}

function formatCalendarRange(from: Date, to: Date, today: string) {
  return formatDateRange(fromCalendarDate(from), fromCalendarDate(to), today.slice(0, 4))
}

// What the trigger shows: the preset's name when the range matches one, otherwise the dates.
// URLs from elsewhere may only set one end, so those read as open-ended.
function rangeLabel({ from, to }: DateRange, today: string) {
  const year = today.slice(0, 4)
  if (from && to)
    return matchDateRangePreset(today, from, to)?.label ?? formatDateRange(from, to, year)
  if (from) return `Since ${formatDate(from, from.startsWith(year) ? "short" : "medium")}`
  if (to) return `Until ${formatDate(to, to.startsWith(year) ? "short" : "medium")}`
  return undefined
}
