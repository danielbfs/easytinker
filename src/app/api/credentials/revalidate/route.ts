import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WORKER_URL = process.env.WORKER_URL ?? "http://worker:8000"

export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cred = await prisma.tinkerCredential.findUnique({ where: { userId } })
  if (!cred) {
    return NextResponse.json({ error: "No saved credential" }, { status: 404 })
  }

  let apiKey: string
  try {
    apiKey = decrypt({
      ciphertext: cred.encryptedKey,
      iv: cred.iv,
      authTag: cred.authTag,
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to decrypt stored key: ${(err as Error).message}` },
      { status: 500 },
    )
  }

  const secret = process.env.WORKER_SECRET
  if (!secret) {
    return NextResponse.json({ error: "WORKER_SECRET not set" }, { status: 500 })
  }

  let validation: {
    valid: boolean
    error?: string | null
    supported_models?: unknown[] | null
    max_batch_size?: number | null
  }
  try {
    const res = await fetch(`${WORKER_URL}/tinker/validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ api_key: apiKey }),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`worker returned ${res.status}`)
    validation = await res.json()
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach worker: ${(err as Error).message}` },
      { status: 502 },
    )
  }

  await prisma.tinkerCredential.update({
    where: { userId },
    data: {
      isValid: validation.valid,
      validatedAt: new Date(),
    },
  })

  return NextResponse.json({
    ok: true,
    valid: validation.valid,
    error: validation.error ?? null,
    models: validation.supported_models ?? [],
    maxBatchSize: validation.max_batch_size ?? null,
  })
}
