import { Barlow_Condensed, Nunito_Sans } from "next/font/google"

// RAS's site uses Adobe fonts (Gainsborough Sans for headings, Omnes Pro for
// body). These are the closest Google Fonts equivalents. Exposed as role-based
// CSS variables and mapped to `font-heading` / `font-body` in globals.css.

export const headingFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-family-heading",
})

export const bodyFont = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-family-body",
})
