// Mirrors the safety-photos bucket settings in the init migration.
export const PHOTO_BUCKET = "safety-photos"
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const MAX_PHOTOS = 10

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
} as const

export type PhotoType = keyof typeof EXTENSIONS
export const PHOTO_TYPES = Object.keys(EXTENSIONS) as PhotoType[]

export function isPhotoType(type: string): type is PhotoType {
  return type in EXTENSIONS
}

// Checked in the browser before uploading; the bucket enforces the same limits.
export function validatePhotoFile(file: { type: string; size: number }) {
  if (!isPhotoType(file.type)) return "Photos must be JPEG, PNG, WebP or HEIC."
  if (file.size > MAX_PHOTO_BYTES) return "Each photo must be 10 MB or smaller."
  return null
}

// {worker_id}/{uuid}.{ext}: the first folder must be the uploader's id for the storage policy.
export function photoPath(userId: string, type: PhotoType) {
  return `${userId}/${crypto.randomUUID()}.${EXTENSIONS[type]}`
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
export const PHOTO_PATH_PATTERN = new RegExp(`^${UUID}/${UUID}\\.(jpg|png|webp|heic)$`)
