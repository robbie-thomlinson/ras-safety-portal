"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { createJobSiteAction, updateJobSiteAction } from "../actions"
import type { JobSite } from "../data"
import { jobSiteSchema, type JobSiteValues } from "../schemas"

type Input = z.input<typeof jobSiteSchema>

// Adds a site, or edits one when `site` is given.
export function JobSiteDialog({ site, trigger }: { site?: JobSite; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const form = useForm<Input, unknown, JobSiteValues>({
    resolver: zodResolver(jobSiteSchema),
    defaultValues: { name: site?.name ?? "", address: site?.address ?? "" },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: JobSiteValues) {
    const result = site ? await updateJobSiteAction(site.id, values) : await createJobSiteAction(values)
    if (!result.ok) {
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof Input, { message: messages[0] })
      }
      toast.error(result.error)
      return
    }
    toast.success(site ? "Job site updated" : "Job site added")
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) form.reset({ name: site?.name ?? "", address: site?.address ?? "" })
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{site ? "Edit job site" : "Add job site"}</DialogTitle>
            <DialogDescription>Farmers choose from active job sites when they fill in a form.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="site-name">Name</FieldLabel>
              <Input id="site-name" aria-invalid={!!errors.name} {...form.register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor="site-address">Address</FieldLabel>
              <Input id="site-address" aria-invalid={!!errors.address} {...form.register("address")} />
              <FieldError errors={[errors.address]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : site ? "Save" : "Add site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
