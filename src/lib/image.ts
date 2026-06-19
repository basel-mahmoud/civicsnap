// Downscale + re-encode a user-selected photo before upload and AI analysis.
// Keeps storage small, AI cost low, and strips most metadata (incl. EXIF GPS)
// since the canvas re-encode drops it.

export interface ProcessedImage {
  blob: Blob
  base64: string // raw base64 (no data: prefix)
  mediaType: string
  width: number
  height: number
  previewUrl: string
}

const MAX_DIM = 1280
const QUALITY = 0.82

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image in this browser.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  )
  if (!blob) throw new Error('Could not encode image.')

  const base64 = await blobToBase64(blob)
  return {
    blob,
    base64,
    mediaType: 'image/jpeg',
    width,
    height,
    previewUrl: URL.createObjectURL(blob),
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
