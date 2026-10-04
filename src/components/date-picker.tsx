"use client"

import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDate, fromCalendarDate, toCalendarDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "Pick a date",
  className,
  ...props
}: {
  id?: string
  value?: string
  onChange: (value: string | undefined) => void
  min?: string
  max?: string
  placeholder?: string
  className?: string
  "aria-invalid"?: boolean
  "aria-label"?: string
}) {
  const [open, setOpen] = useState(false)
  const disabled = [
    ...(min ? [{ before: toCalendarDate(min) }] : []),
    ...(max ? [{ after: toCalendarDate(max) }] : []),
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "h-10 justify-start font-normal",
            !value && "text-muted-foreground",
            className,
          )}
          {...props}
        >
          <CalendarIcon data-icon="inline-start" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? toCalendarDate(value) : undefined}
          defaultMonth={value ? toCalendarDate(value) : max ? toCalendarDate(max) : undefined}
          disabled={disabled}
          onSelect={(date) => {
            onChange(date ? fromCalendarDate(date) : undefined)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
