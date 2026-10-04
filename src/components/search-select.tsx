"use client"

import { Command as CommandPrimitive } from "cmdk"
import { SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command"
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

export type SearchSelectOption = { id: string | number; name: string; tag?: string }

// A search box that picks one option: with a few hundred workers, scrolling a dropdown for one name is slow.
// Empty means "all", so clearing the text clears the filter.
// cmdk sets the input's id and aria-labelledby itself, so a <label htmlFor> can't reach it. `label` is
// rendered as cmdk's own visually hidden label instead.
export function SearchSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  className,
}: {
  label: string
  value: string | number | undefined
  options: SearchSelectOption[]
  placeholder: string
  onChange: (value: string | undefined) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  // null while not typing, so the box shows the current selection.
  const [query, setQuery] = useState<string | null>(null)

  const selected = options.find((option) => String(option.id) === String(value))
  const text = query ?? selected?.name ?? ""
  const search = query?.trim().toLowerCase() ?? ""
  // Plain substring match on the name; cmdk's fuzzy scoring reorders results and matches stray letters.
  const matches = search
    ? options.filter((option) => option.name.toLowerCase().includes(search))
    : options

  function close() {
    setOpen(false)
    setQuery(null)
  }

  function choose(next: string) {
    onChange(next)
    close()
  }

  return (
    <Command
      label={label}
      shouldFilter={false}
      className={cn("relative h-auto overflow-visible bg-transparent p-0", className)}
    >
      <InputGroup className="h-9">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <CommandPrimitive.Input
          data-slot="input-group-control"
          className="h-full min-w-0 flex-1 truncate bg-transparent pr-2.5 text-sm outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={text}
          onValueChange={(next) => {
            setQuery(next)
            setOpen(true)
            if (!next.trim() && value) onChange(undefined)
          }}
          onFocus={(e) => {
            e.currentTarget.select() // so typing replaces the current selection
            setOpen(true)
          }}
          onBlur={close}
          onKeyDown={(e) => {
            if (e.key === "Escape") close()
            else if (e.key === "ArrowDown") setOpen(true)
          }}
        />
        {text && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear"
              className="text-muted-foreground"
              onClick={() => {
                if (value) onChange(undefined)
                close()
              }}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {open && (
        <div
          // Keep focus in the input so clicking an option doesn't blur (and close) the list first.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 z-50 mt-1 w-full min-w-64 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          <CommandList>
            <CommandEmpty>No matches</CommandEmpty>
            {matches.map((option) => (
              <CommandItem
                key={option.id}
                value={String(option.id)}
                data-checked={selected?.id === option.id}
                onSelect={() => choose(String(option.id))}
              >
                <span className="truncate">{option.name}</span>
                {option.tag && <Badge variant="outline">{option.tag}</Badge>}
              </CommandItem>
            ))}
          </CommandList>
        </div>
      )}
    </Command>
  )
}
