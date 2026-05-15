import 'server-only'

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { withLogging } from '@/lib/server/middleware/withLogging'
import { compose } from '@/lib/server/middleware/withRole'
import type { TenantHandler } from '@/lib/server/middleware/withTenant'
import { ApiKeySchema } from '@/lib/schemas/school'

const getHandler: TenantHandler = async (_req, ctx) => {
  const { schoolId, tx } = ctx

  const keys = await tx.apiKey.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
      // keyHash intentionally excluded — never expose
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(keys)
}

const postHandler: TenantHandler = async (req, ctx) => {
  const { schoolId, tx } = ctx

  const body = await req.json().catch(() => null)
  const parsed = ApiKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { name, expiresAt } = parsed.data

  const rawKey = crypto.randomBytes(32).toString('hex')
  const keyHash = await bcrypt.hash(rawKey, 10)

  const apiKey = await tx.apiKey.create({
    data: {
      schoolId,
      name,
      keyHash,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    select: {
      id: true,
      name: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  // WARNING: rawKey is returned only once and cannot be retrieved again.
  // Store it securely immediately — it is not recoverable after this response.
  return NextResponse.json({ ...apiKey, rawKey }, { status: 201 })
}

export const GET = withLogging(compose('school_admin')(getHandler))
export const POST = withLogging(compose('school_admin')(postHandler))
