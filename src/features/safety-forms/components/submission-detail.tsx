import { CheckIcon, ImageIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/dates"
import { cn } from "@/lib/utils"

import type { SafetyFormDetail } from "../data"
import { CHECKLIST_ITEMS, CHECKLIST_SECTIONS } from "../schemas"

export function SubmissionDetail({
  form,
  showWorker,
}: {
  form: SafetyFormDetail
  showWorker: boolean
}) {
  const noCount = Object.values(form.checklist).filter((answer) => !answer).length

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Checklist</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {noCount > 0 && (
              <p className="flex items-center gap-2 rounded-lg bg-warning/20 px-3 py-2 text-sm font-medium">
                <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
                {noCount === 1 ? "1 item was" : `${noCount} items were`} answered No
              </p>
            )}
            {CHECKLIST_SECTIONS.map((section) => (
              <section key={section.title} className="flex flex-col gap-2">
                <h3 className="text-sm text-muted-foreground">{section.title}</h3>
                <ul className="divide-y rounded-lg border">
                  {section.items.map((item) => {
                    const yes = form.checklist[item]
                    return (
                      <li
                        key={item}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                      >
                        <span>{CHECKLIST_ITEMS[item]}</span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                            yes
                              ? "bg-success/15 text-brand-green-800"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {yes ? (
                            <CheckIcon className="size-3.5" aria-hidden />
                          ) : (
                            <XIcon className="size-3.5" aria-hidden />
                          )}
                          {yes ? "Yes" : "No"}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {form.notes ? (
              <p className="text-sm whitespace-pre-wrap">{form.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No notes.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Photos ({form.photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {form.photos.map((photo, i) => (
                <li key={photo.id}>
                  <PhotoTile
                    url={photo.url}
                    contentType={photo.contentType}
                    label={`Photo ${i + 1}`}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-xl">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3 text-sm">
            {showWorker && <DetailRow label="Worker" value={form.worker.name} />}
            <DetailRow label="Job site" value={form.jobSite.name} />
            <DetailRow label="Address" value={form.jobSite.address} />
            <DetailRow label="Submitted" value={formatDateTime(form.createdAt)} />
            {form.review && (
              <DetailRow
                label="Reviewed"
                value={
                  form.review.reviewerName
                    ? `${formatDateTime(form.review.reviewedAt)} by ${form.review.reviewerName}`
                    : formatDateTime(form.review.reviewedAt)
                }
              />
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold text-muted-foreground uppercase">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

// Signed Storage URLs, so a plain <img> rather than next/image. Most browsers can't show HEIC,
// so those get a link to open the file instead.
function PhotoTile({
  url,
  contentType,
  label,
}: {
  url: string | null
  contentType: string
  label: string
}) {
  const tile =
    "flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-muted"
  if (!url) {
    return (
      <div className={cn(tile, "text-xs text-muted-foreground")}>
        <span>Unavailable</span>
      </div>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(tile, "transition-opacity hover:opacity-90")}
    >
      {contentType === "image/heic" ? (
        <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <ImageIcon className="size-6" aria-hidden />
          Open HEIC photo
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} loading="lazy" className="size-full object-cover" />
      )}
    </a>
  )
}
