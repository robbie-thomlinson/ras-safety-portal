"use client"

import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const option =
  "flex h-9 min-w-16 items-center justify-center rounded-md px-4 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"

// A checklist answer. Starts unanswered so framers have to make a choice for every item.
export function YesNo({
  value,
  onChange,
  ref,
  invalid,
  ...props
}: {
  value: boolean | undefined
  onChange: (value: boolean) => void
  ref?: React.Ref<HTMLButtonElement>
  invalid?: boolean
  "aria-labelledby"?: string
}) {
  return (
    <RadioGroupPrimitive.Root
      value={value === undefined ? "" : value ? "yes" : "no"}
      onValueChange={(v) => onChange(v === "yes")}
      orientation="horizontal"
      aria-invalid={invalid}
      className={cn(
        "inline-flex shrink-0 gap-1 rounded-lg border bg-background p-0.5",
        invalid && "border-destructive ring-3 ring-destructive/20",
      )}
      {...props}
    >
      <RadioGroupPrimitive.Item
        ref={ref}
        value="yes"
        className={cn(option, "data-checked:bg-primary data-checked:text-primary-foreground")}
      >
        Yes
      </RadioGroupPrimitive.Item>
      <RadioGroupPrimitive.Item
        value="no"
        className={cn(option, "data-checked:bg-destructive data-checked:text-white")}
      >
        No
      </RadioGroupPrimitive.Item>
    </RadioGroupPrimitive.Root>
  )
}
