"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Every chart here is a single series of counts, so one brand hue and no legend: the card title names it.
const config = { count: { label: "Forms", color: "var(--chart-1)" } } satisfies ChartConfig

export function PerDayChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ top: 8, left: -16, right: 4 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={12} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  )
}

// Horizontal bars, so long names stay readable on a phone. Values are labelled at the bar end.
export function RankedBarChart({
  data,
  labelKey,
}: {
  data: { count: number }[]
  labelKey: string
}) {
  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: Math.max(data.length * 40, 80) }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 32 }} barCategoryGap={6}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey={labelKey} tickLine={false} axisLine={false} width={150} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent hideLabel={false} />}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} maxBarSize={24}>
          <LabelList dataKey="count" position="right" className="fill-foreground" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
