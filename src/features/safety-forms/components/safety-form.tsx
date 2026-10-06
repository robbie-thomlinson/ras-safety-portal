"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { DatePicker } from "@/components/date-picker"
import { SearchSelect } from "@/components/search-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

import { submitSafetyFormAction } from "../actions"
import { MAX_PHOTOS } from "../photos"
import {
  CHECKLIST_ITEMS,
  CHECKLIST_SECTIONS,
  safetyFormSchema,
  type SafetyFormInput,
  type SafetyFormValues,
} from "../schemas"
import { usePhotoUploads } from "../use-photo-uploads"
import { PhotoPicker } from "./photo-picker"
import { YesNo } from "./yes-no"

const NOTES_MAX = 2000

export function SafetyForm({
  userId,
  jobSites,
  today,
}: {
  userId: string
  jobSites: { id: number; name: string }[]
  today: string
}) {
  const router = useRouter()
  const uploads = usePhotoUploads(userId)
  const [formError, setFormError] = useState<string | null>(null)
  // Stays true while the router moves to the new submission, so the button can't double-submit.
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<SafetyFormInput, unknown, SafetyFormValues>({
    resolver: zodResolver(safetyFormSchema),
    defaultValues: { jobSiteId: "", date: today, notes: "", photoPaths: [] },
  })
  const { errors, isSubmitted, isSubmitting } = form.formState

  // Keep the form's photoPaths in step with finished uploads (paths never contain commas).
  const pathsKey = uploads.paths.join(",")
  const { setValue } = form
  useEffect(() => {
    setValue("photoPaths", pathsKey ? pathsKey.split(",") : [], { shouldValidate: isSubmitted })
  }, [pathsKey, setValue, isSubmitted])

  async function onSubmit(values: SafetyFormValues) {
    setFormError(null)
    if (uploads.uploading) return setFormError("Wait for your photos to finish uploading.")
    if (uploads.failed) return setFormError("Remove the photos that didn't upload, then try again.")

    const result = await submitSafetyFormAction(values)
    if (!result.ok) {
      setFormError(result.error)
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof SafetyFormInput, { message: messages[0] })
      }
      return
    }
    setSubmitted(true)
    toast.success("Safety form submitted")
    router.push(`/submissions/${result.data.id}`)
  }

  const notesLength = useWatch({ control: form.control, name: "notes" })?.length ?? 0
  const busy = isSubmitting || submitted

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* Cards clip their contents; the job site search list has to hang out past this one. */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="text-xl">Site and date</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="sm:flex-row">
            <Controller
              control={form.control}
              name="jobSiteId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  {/* Visual only: SearchSelect names its input itself (see search-select.tsx). */}
                  <FieldLabel aria-hidden>Job site</FieldLabel>
                  <SearchSelect
                    ref={field.ref}
                    label="Job site"
                    placeholder="Search job sites"
                    value={String(field.value)}
                    options={jobSites}
                    onChange={(value) => field.onChange(value ?? "")}
                    invalid={fieldState.invalid}
                    className="w-full *:data-[slot=input-group]:h-10"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="date"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="date">Date</FieldLabel>
                  <DatePicker
                    id="date"
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? "")}
                    max={today}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Safety checklist</CardTitle>
          <CardDescription>Answer every item for this site today.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {CHECKLIST_SECTIONS.map((section) => (
            <section key={section.title} className="flex flex-col gap-2">
              <h3 className="text-sm text-muted-foreground">{section.title}</h3>
              <ul className="divide-y rounded-lg border">
                {section.items.map((item) => (
                  <Controller
                    key={item}
                    control={form.control}
                    name={item}
                    render={({ field, fieldState }) => (
                      <li className="flex flex-col gap-1.5 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span id={`${item}-label`} className="text-sm font-medium">
                            {CHECKLIST_ITEMS[item]}
                          </span>
                          <YesNo
                            ref={field.ref}
                            value={field.value}
                            onChange={field.onChange}
                            invalid={fieldState.invalid}
                            aria-labelledby={`${item}-label`}
                          />
                        </div>
                        <FieldError errors={[fieldState.error]} />
                      </li>
                    )}
                  />
                ))}
              </ul>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Notes</CardTitle>
          <CardDescription>
            Optional. Anything the reviewer should know, like hazards or fixes made.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field data-invalid={!!errors.notes}>
            <FieldLabel htmlFor="notes" className="sr-only">
              Notes
            </FieldLabel>
            <Textarea
              id="notes"
              rows={4}
              aria-invalid={!!errors.notes}
              {...form.register("notes")}
            />
            <FieldDescription className="text-right text-xs">
              {notesLength} / {NOTES_MAX}
            </FieldDescription>
            <FieldError errors={[errors.notes]} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Photos</CardTitle>
          <CardDescription>
            Add 1 to {MAX_PHOTOS} photos of the site. JPEG, PNG, WebP or HEIC, up to 10 MB each.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <PhotoPicker
            id="photos"
            photos={uploads.photos}
            onAdd={uploads.add}
            onRemove={uploads.remove}
            invalid={!!errors.photoPaths}
          />
          <FieldError errors={[errors.photoPaths]} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {formError && <FieldError>{formError}</FieldError>}
        <Button
          type="submit"
          size="lg"
          className="h-11 sm:self-end sm:px-8"
          disabled={busy || uploads.uploading}
        >
          {uploads.uploading ? "Uploading photos…" : busy ? "Submitting…" : "Submit safety form"}
        </Button>
      </div>
    </form>
  )
}
