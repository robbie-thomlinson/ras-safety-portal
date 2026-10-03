import { z } from "zod"

export const jobSiteSchema = z.object({
  name: z.string().trim().min(1, "Enter a site name").max(120, "Name must be 120 characters or fewer"),
  address: z.string().trim().min(1, "Enter an address").max(250, "Address must be 250 characters or fewer"),
})

export type JobSiteValues = z.output<typeof jobSiteSchema>
