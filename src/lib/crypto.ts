import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12
const KEY_BYTES = 32
const TAG_BYTES = 16

export type EncryptedPayload = {
  ciphertext: string
  iv: string
  authTag: string
}

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex) {
    throw new Error("ENCRYPTION_KEY is not set")
  }
  const key = Buffer.from(hex, "hex")
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${key.length}). ` +
        `Generate with: openssl rand -hex ${KEY_BYTES}`,
    )
  }
  return key
}

export function encrypt(plaintext: string): EncryptedPayload {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    ciphertext: ciphertext.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  }
}

export function decrypt(payload: EncryptedPayload): string {
  const iv = Buffer.from(payload.iv, "hex")
  const authTag = Buffer.from(payload.authTag, "hex")
  if (iv.length !== IV_BYTES) throw new Error("Invalid IV length")
  if (authTag.length !== TAG_BYTES) throw new Error("Invalid auth tag length")

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "hex")),
    decipher.final(),
  ])
  return plaintext.toString("utf8")
}
