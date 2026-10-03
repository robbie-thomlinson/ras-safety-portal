"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

import { isPhotoType, MAX_PHOTOS, PHOTO_BUCKET, photoPath, validatePhotoFile } from "./photos"

export type UploadedPhoto = {
  key: string
  name: string
  // Object URL for the thumbnail; null for HEIC, which most browsers can't display.
  previewUrl: string | null
  status: "uploading" | "uploaded" | "error"
  path?: string
}

// Photos upload straight to Storage as soon as they're picked, so submitting the form only
// sends their paths. Removing one before submitting also deletes it from Storage.
export function usePhotoUploads(userId: string) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [supabase] = useState(createClient)

  // Revoke thumbnails on unmount. A ref, because the cleanup needs the latest list.
  const latest = useRef(photos)
  useEffect(() => {
    latest.current = photos
  }, [photos])
  useEffect(() => () => latest.current.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl)), [])

  function update(key: string, changes: Partial<UploadedPhoto>) {
    setPhotos((current) => current.map((p) => (p.key === key ? { ...p, ...changes } : p)))
  }

  async function upload(key: string, file: File) {
    if (!isPhotoType(file.type)) return
    const path = photoPath(userId, file.type)
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type })
    if (error) {
      update(key, { status: "error" })
      toast.error(`${file.name} didn't upload. Remove it and try again.`)
    } else {
      update(key, { status: "uploaded", path })
    }
  }

  function add(files: FileList | File[]) {
    const room = MAX_PHOTOS - photos.length
    const accepted: File[] = []
    for (const file of Array.from(files)) {
      const error = validatePhotoFile(file)
      if (error) toast.error(`${file.name}: ${error}`)
      else accepted.push(file)
    }
    if (accepted.length > room) toast.error(`You can add up to ${MAX_PHOTOS} photos.`)

    const added = accepted.slice(0, Math.max(room, 0)).map((file) => ({
      file,
      photo: {
        key: crypto.randomUUID(),
        name: file.name,
        previewUrl: file.type === "image/heic" ? null : URL.createObjectURL(file),
        status: "uploading" as const,
      },
    }))
    setPhotos((current) => [...current, ...added.map((a) => a.photo)])
    added.forEach(({ file, photo }) => upload(photo.key, file))
  }

  function remove(key: string) {
    const photo = photos.find((p) => p.key === key)
    if (!photo) return
    setPhotos((current) => current.filter((p) => p.key !== key))
    if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl)
    // Best effort: an orphaned upload is harmless, it just isn't attached to anything.
    if (photo.path) void supabase.storage.from(PHOTO_BUCKET).remove([photo.path])
  }

  return {
    photos,
    add,
    remove,
    paths: photos.flatMap((p) => (p.status === "uploaded" && p.path ? [p.path] : [])),
    uploading: photos.some((p) => p.status === "uploading"),
    failed: photos.some((p) => p.status === "error"),
  }
}
