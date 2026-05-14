"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type Status = {
  isValid: boolean
  validatedAt: string | null
  createdAt: string
  updatedAt: string
} | null

type ValidationResult = {
  ok: boolean
  saved?: boolean
  valid?: boolean
  error?: string | null
  models?: unknown[]
  maxBatchSize?: number | null
}

function modelLabel(m: unknown): string {
  if (typeof m === "string") return m
  if (m && typeof m === "object") {
    const obj = m as Record<string, unknown>
    if (typeof obj.model_name === "string") return obj.model_name
    if (typeof obj.name === "string") return obj.name
    if (typeof obj.id === "string") return obj.id
    return JSON.stringify(m)
  }
  return String(m)
}

// Renders text with any http(s) URL turned into a clickable link. Used for
// validation errors that include things like the Tinker billing console URL.
function renderWithLinks(text: string): React.ReactNode[] {
  const urlPattern = /(https?:\/\/[^\s)]+)/g
  const parts = text.split(urlPattern)
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 dark:text-blue-400 break-all"
        >
          {part}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function CredentialsForm({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [apiKey, setApiKey] = useState("")
  const [isSubmitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  async function saveKey(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim()) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      setResult({ ok: res.ok && data.ok, ...data })
      // The key gets persisted whenever the API returns `saved: true`, even
      // when validation failed (e.g. billing paused) — refresh status so the
      // user sees the new record and can click Revalidate later.
      if (res.ok && data.saved) {
        setApiKey("")
        const statusRes = await fetch("/api/credentials")
        const statusData = await statusRes.json()
        setStatus(statusData.credential)
      }
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  async function revalidate() {
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch("/api/credentials/revalidate", { method: "POST" })
      const data = await res.json()
      setResult({ ok: res.ok && data.ok && data.valid, ...data })
      const statusRes = await fetch("/api/credentials")
      const statusData = await statusRes.json()
      setStatus(statusData.credential)
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  async function removeKey() {
    if (!confirm("Remove the saved Tinker API key?")) return
    setSubmitting(true)
    setResult(null)
    try {
      await fetch("/api/credentials", { method: "DELETE" })
      setStatus(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Status</h2>
        {status ? (
          <div className="mt-2 flex flex-col gap-1 text-sm">
            <span>
              {status.isValid ? "✅ Configured and valid" : "⚠️ Configured but invalid"}
            </span>
            <span className="text-muted-foreground">
              Last validated:{" "}
              {status.validatedAt ? new Date(status.validatedAt).toLocaleString() : "never"}
            </span>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" onClick={revalidate} disabled={isSubmitting}>
                Revalidate
              </Button>
              <Button type="button" variant="outline" onClick={removeKey} disabled={isSubmitting}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No Tinker API key saved yet.
          </p>
        )}
      </section>

      <form onSubmit={saveKey} className="rounded-lg border p-4 flex flex-col gap-3">
        <label htmlFor="api-key" className="text-sm font-semibold">
          {status ? "Replace API key" : "Add API key"}
        </label>
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          placeholder="tk_..."
          className="rounded border px-3 py-2 text-sm font-mono"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Stored encrypted (AES-256-GCM) in the database. Get yours at the
          Tinker console.
        </p>
        <div>
          <Button type="submit" disabled={isSubmitting || apiKey.trim().length < 8}>
            {isSubmitting ? "Validating…" : "Save and validate"}
          </Button>
        </div>
      </form>

      {result && (
        <section
          className={`rounded-lg border p-4 ${
            result.ok ? "border-green-500/50" : "border-red-500/50"
          }`}
        >
          {result.ok ? (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold">Validated against Tinker</span>
              {typeof result.maxBatchSize === "number" && (
                <span className="text-muted-foreground">
                  Max batch size: {result.maxBatchSize}
                </span>
              )}
              {Array.isArray(result.models) && result.models.length > 0 ? (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    {result.models.length} supported model(s):
                  </div>
                  <ul className="font-mono text-xs grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
                    {result.models.map((m, i) => (
                      <li key={i}>{modelLabel(m)}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <span className="text-muted-foreground">No models returned.</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-red-600 dark:text-red-400">
                Validation failed
              </span>
              <p className="text-sm leading-relaxed">
                {renderWithLinks(result.error ?? "Unknown error")}
              </p>
              {result.saved && (
                <p className="text-xs text-muted-foreground">
                  The key was saved anyway. Use the Revalidate button above
                  once the underlying issue is fixed.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
