import 'server-only'

// bcrypt is used for API keys for the same reason as passwords — a compromised
// database cannot be used to impersonate callers.
import bcrypt from 'bcryptjs'
import { db } from '@/lib/server/db'

/**
 * Verifies an API key in "<keyId>.<rawSecret>" format against the given school.
 * Returns false if the key is not found, belongs to a different school, is expired,
 * or the secret does not match the stored hash.
 */
export async function verifyApiKey(rawKey: string, schoolId: string): Promise<boolean> {
  const dot = rawKey.indexOf('.')
  if (dot < 1) return false

  const keyId = rawKey.slice(0, dot)
  const secret = rawKey.slice(dot + 1)

  const record = await db.apiKey.findUnique({ where: { id: keyId } })
  if (!record || record.schoolId !== schoolId) return false
  if (record.expiresAt && record.expiresAt < new Date()) return false

  return bcrypt.compare(secret, record.keyHash)
}
