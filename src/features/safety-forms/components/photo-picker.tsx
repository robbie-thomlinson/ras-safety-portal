"use client"

import { CameraIcon, ImageIcon, Loader2Icon, TriangleAlertIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { MAX_PHOTOS, PHOTO_TYPES } from "../photos"
import type { UploadedPhoto } from "../use-photo-uploads"

export function PhotoPicker({
  id,
  photos,
  onAdd,
  onRemove,
  invalid,
}: {
  id: string
  photos: UploadedPhoto[]
  onAdd: (files: FileList) => void
  onRemove: (key: string) => void
  invalid?: boolean
}) {
  const full = photos.length >= MAX_PHOTOS
  const tile = "relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted"

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((photo) => (
        <li key={photo.key} className={cn(tile, photo.status === "error" && "border-destructive")}>
          {photo.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.previewUrl} alt={photo.name} className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 px-1 text-center text-xs break-all text-muted-foreground">
              <ImageIcon className="size-5" aria-hidden />
              {photo.name}
            </span>
          )}
          {photo.status === "uploading" && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
              <Loader2Icon className="size-6 animate-spin" aria-label="Uploading" />
            </span>
          )}
          {photo.status === "error" && (
            <span className="absolute inset-0 flex items-center justify-center bg-destructive/60 text-white">
              <TriangleAlertIcon className="size-6" aria-label="Upload failed" />
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemove(photo.key)}
            className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label={`Remove ${photo.name}`}
          >
            <XIcon className="size-4" />
          </button>
        </li>
      ))}
      {!full && (
        <li>
          <label
            htmlFor={id}
            className={cn(
              tile,
              "cursor-pointer flex-col gap-1 border-2 border-dashed bg-background text-sm font-semibold text-primary hover:bg-secondary has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              invalid && "border-destructive"
            )}
          >
            <CameraIcon className="size-6" aria-hidden />
            Add photos
            <input
              id={id}
              type="file"
              accept={PHOTO_TYPES.join(",")}
              multiple
              className="sr-only"
              aria-invalid={invalid}
              onChange={(e) => {
                if (e.target.files?.length) onAdd(e.target.files)
                // Clear it so picking the same file again still fires onChange.
                e.target.value = ""
              }}
            />
          </label>
        </li>
      )}
    </ul>
  )
}
