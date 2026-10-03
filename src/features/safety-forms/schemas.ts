import { z } from "zod"

import { todayInRasTimeZone } from "@/lib/dates"

import { MAX_PHOTOS, PHOTO_PATH_PATTERN } from "./photos"

export const CHECKLIST_ITEMS = {
  hardHatWorn: "Hard hat worn",
  vestWorn: "High-visibility vest worn",
  bootsWorn: "Safety boots worn",
  eyeProtectionWorn: "Eye protection worn",
  fallProtectionInspected: "Fall protection in place",
  scaffoldingInspected: "Scaffolding inspected",
  laddersInspected: "Ladders inspected",
  toolsInspected: "Tools in good condition",
  cordsInspected: "Cords in good condition",
  hazardsIdentified: "Hazards identified",
} as const

export type ChecklistItem = keyof typeof CHECKLIST_ITEMS

const checklistAnswer = z.boolean({ error: "Answer this checklist item" })

const isoDate = z.iso.date({ error: "Choose a date" })

export const safetyFormSchema = z.object({
  jobSiteId: z.coerce
    .number({ error: "Choose a job site" })
    .int("Choose a job site")
    .positive("Choose a job site"),
  date: isoDate.refine((date) => date <= todayInRasTimeZone(), "Date can't be in the future"),
  hardHatWorn: checklistAnswer,
  vestWorn: checklistAnswer,
  bootsWorn: checklistAnswer,
  eyeProtectionWorn: checklistAnswer,
  fallProtectionInspected: checklistAnswer,
  scaffoldingInspected: checklistAnswer,
  laddersInspected: checklistAnswer,
  toolsInspected: checklistAnswer,
  cordsInspected: checklistAnswer,
  hazardsIdentified: checklistAnswer,
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer").optional(),
  photoPaths: z
    .array(z.string().regex(PHOTO_PATH_PATTERN, "Invalid photo"))
    .min(1, "Add at least one photo")
    .max(MAX_PHOTOS, `Add no more than ${MAX_PHOTOS} photos`)
    .refine((paths) => new Set(paths).size === paths.length, "Each photo can only be added once"),
})

export type SafetyFormInput = z.input<typeof safetyFormSchema>
export type SafetyFormValues = z.output<typeof safetyFormSchema>

export const reviewSchema = z.object({
  formId: z.coerce.number().int().positive(),
  status: z.enum(["submitted", "reviewed"]),
})

// Admin list filters, usually read from search params.
export const formFiltersSchema = z
  .object({
    jobSiteId: z.coerce.number().int().positive().optional(),
    workerId: z.uuid().optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((f) => !f.from || !f.to || f.from <= f.to, { message: "Start date must be before end date", path: ["to"] })

export type FormFilters = z.output<typeof formFiltersSchema>
