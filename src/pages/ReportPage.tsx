import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { processImage, type ProcessedImage } from '@/lib/image'
import { classifyPhoto, createReport, uploadReportPhoto } from '@/lib/api'
import { CATEGORY_LIST, type CategoryId, type Severity } from '@/lib/categories'
import type { AIClassification } from '@/lib/types'
import {
  LocationPicker,
  reverseGeocode,
  type LatLng,
} from '@/components/map/LocationPicker'
import { Button, Card, Field, Spinner, inputClass } from '@/components/ui'
import { Icon } from '@/components/icons/Icon'

export function ReportPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  // Stable across retries/double-submits of the same report, so creation is idempotent.
  const idemKeyRef = useRef<string | null>(null)

  const [photo, setPhoto] = useState<ProcessedImage | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [classifying, setClassifying] = useState(false)
  const [ai, setAi] = useState<AIClassification | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CategoryId>('other')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [location, setLocation] = useState<LatLng | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    setAi(null)
    try {
      const processed = await processImage(file)
      setPhoto(processed)
      void runClassify(processed)
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not read that image.')
    }
  }

  async function runClassify(processed: ProcessedImage) {
    setClassifying(true)
    try {
      const result = await classifyPhoto(processed.base64, processed.mediaType)
      setAi(result)
      setTitle(result.title)
      setDescription(result.description)
      setCategory(result.category)
      setSeverity(result.severity)
    } catch (err) {
      // Non-fatal: user can still fill the form manually.
      setAi({
        category: 'other',
        severity: 'medium',
        title: '',
        description: '',
        confidence: 0,
        is_valid_issue: true,
      })
      setPhotoError(
        err instanceof Error
          ? `AI analysis unavailable (${err.message}). Fill in the details below.`
          : 'AI analysis unavailable. Fill in the details below.',
      )
    } finally {
      setClassifying(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !photo || !location) return
    setSubmitError(null)
    setSubmitting(true)
    // Reuse the same key for any retry of this submission so we never duplicate.
    const idempotencyKey = (idemKeyRef.current ??= crypto.randomUUID())
    try {
      const userId = session.user.id
      const [photo_path, address] = await Promise.all([
        uploadReportPhoto(userId, photo.blob),
        reverseGeocode(location.lat, location.lng),
      ])
      const report = await createReport(
        userId,
        {
          title: title.trim() || 'Reported issue',
          description: description.trim(),
          category,
          severity,
          lat: location.lat,
          lng: location.lng,
          address,
          photo_path,
          ai_summary: ai?.description ?? null,
          ai_confidence: ai?.confidence ?? null,
        },
        idempotencyKey,
      )
      idemKeyRef.current = null // fresh key for the next distinct report
      navigate(`/report/${report.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your report.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = Boolean(photo && location && title.trim() && !classifying)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-app">Report an issue</h1>
      <p className="mt-1 text-soft">
        Add a photo — our AI will categorize it — then confirm the location and submit.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        {/* Step 1: photo */}
        <Card className="p-5">
          <h2 className="font-semibold text-app">1. Photo</h2>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPickFile}
          />

          {!photo ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 w-full rounded-xl border-2 border-dashed border-app bg-muted2 py-10 grid place-items-center text-soft hover:border-brand-500 hover:text-app transition"
            >
              <Icon name="camera" size={32} />
              <span className="mt-2 font-medium">Take or choose a photo</span>
              <span className="text-xs">JPG / PNG / WEBP · up to 5 MB</span>
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-app">
                <img src={photo.previewUrl} alt="Selected issue" className="w-full object-cover max-h-72" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 right-2 rounded-lg bg-black/60 text-white text-xs px-3 py-1.5"
                >
                  Replace
                </button>
              </div>

              {classifying && (
                <div className="flex items-center gap-2 text-sm text-soft">
                  <Spinner className="size-4" /> Analyzing photo with AI…
                </div>
              )}

              {ai && !classifying && ai.confidence > 0 && (
                <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 px-3 py-2 text-sm">
                  <span className="inline-flex items-center gap-1 font-medium text-brand-700 dark:text-brand-300 align-middle">
                    <Icon name="sparkles" size={14} /> AI suggestion
                  </span>{' '}
                  <span className="text-app">
                    {ai.is_valid_issue
                      ? `Looks like a "${categoryLabel(ai.category)}" issue (${Math.round(
                          ai.confidence * 100,
                        )}% confident). Review and edit below.`
                      : "This doesn't look like a typical civic issue — you can still submit if it is."}
                  </span>
                </div>
              )}
            </div>
          )}

          {photoError && <p className="mt-2 text-sm text-amber-600">{photoError}</p>}
        </Card>

        {/* Step 2: details */}
        {photo && (
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-app">2. Details</h2>
            <Field label="Title">
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole near the bus stop"
                maxLength={140}
                required
              />
            </Field>
            <Field label="Description" hint="What's the problem and why does it matter?">
              <textarea
                className={`${inputClass} h-24 py-2 resize-none`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
                >
                  {CATEGORY_LIST.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Severity">
                <select
                  className={inputClass}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
            </div>
          </Card>
        )}

        {/* Step 3: location */}
        {photo && (
          <Card className="p-5">
            <h2 className="font-semibold text-app mb-3">3. Location</h2>
            <LocationPicker value={location} onChange={setLocation} />
          </Card>
        )}

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" size="lg" loading={submitting} disabled={!canSubmit}>
            Submit report
          </Button>
        </div>
        {!canSubmit && photo && !classifying && (
          <p className="text-right text-xs text-soft">
            {!title.trim() ? 'Add a title' : !location ? 'Set the location' : ''}
          </p>
        )}
      </form>
    </div>
  )
}

function categoryLabel(id: string): string {
  return CATEGORY_LIST.find((c) => c.id === id)?.label ?? 'Other'
}
