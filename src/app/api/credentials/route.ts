import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt } from "@/lib/crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WORKER_URL = process.env.WORKER_URL ?? "http://worker:8000"

// Worker times out internally after ~20s; we give it 30s of margin.
const VALIDATE_FETCH_TIMEOUT_MS = 30_000

async function callWorkerValidate(apiKey: string) {
  const secret = process.env.WORKER_SECRET
  if (!secret) throw new Error("WORKER_SECRET is not set")

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), VALIDATE_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${WORKER_URL}/tinker/validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ api_key: apiKey }),
      cache: "no-store",
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`worker returned ${res.status}: ${text.slice(0, 200)}`)
    }
    return (await res.json()) as {
      valid: boolean
      error?: string | null
      supported_models?: unknown[] | null
      max_batch_size?: number | null
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(
        `Validation request timed out after ${VALIDATE_FETCH_TIMEOUT_MS / 1000}s`,
      )
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cred = await prisma.tinkerCredential.findUnique({
    where: { userId },
    select: {
      isValid: true,
      validatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ credential: cred })
}

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { apiKey?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : ""
  if (apiKey.length < 8) {
    return NextResponse.json({ error: "API key looks too short" }, { status: 400 })
  }

  let validation
  try {
    validation = await callWorkerValidate(apiKey)
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach worker: ${(err as Error).message}` },
      { status: 502 },
    )
  }

  if (!validation.valid) {
    return NextResponse.json(
      { ok: false, error: validation.error ?? "Tinker rejected the key" },
      { status: 400 },
    )
  }

  const enc = encrypt(apiKey)
  await prisma.tinkerCredential.upsert({
    where: { userId },
    create: {
      userId,
      encryptedKey: enc.ciphertext,
      iv: enc.iv,
      authTag: enc.authTag,
      isValid: true,
      validatedAt: new Date(),
    },
    update: {
      encryptedKey: enc.ciphertext,
      iv: enc.iv,
      authTag: enc.authTag,
      isValid: true,
      validatedAt: new Date(),
    },
  })

  return NextResponse.json({
    ok: true,
    models: validation.supported_models ?? [],
    maxBatchSize: validation.max_batch_size ?? null,
  })
}

export async function DELETE() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.tinkerCredential.deleteMany({ where: { userId } })
  return NextResponse.json({ ok: true })
}
