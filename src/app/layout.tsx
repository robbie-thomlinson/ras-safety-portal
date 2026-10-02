import type { Metadata } from "next"

import { Toaster } from "@/components/ui/sonner"
import { bodyFont, headingFont } from "@/lib/fonts"
import { cn } from "@/lib/utils"

import "./globals.css"

export const metadata: Metadata = {
  title: "RAS Site Safety",
  description: "Daily job site safety checklists for Ron Anderson & Sons Ltd.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(headingFont.variable, bodyFont.variable, "h-full antialiased")}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
