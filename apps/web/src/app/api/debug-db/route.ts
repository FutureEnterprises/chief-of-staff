import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

export async function GET() {
  const url = process.env.DATABASE_URL ?? 'NOT SET'
  let host = 'unknown'
  try {
    const u = new URL(url)
    host = `${u.username.split(':')[0]}@${u.hostname}:${u.port}`
  } catch {}

  try {
    const count = await prisma.user.count()
    return NextResponse.json({ ok: true, userCount: count, host })
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; name?: string; meta?: unknown }
    console.error('[debug-db] error:', JSON.stringify({ name: e?.name, code: e?.code, message: e?.message, meta: e?.meta }))
    return NextResponse.json({ ok: false, host, name: e?.name, code: e?.code, message: e?.message, meta: e?.meta }, { status: 500 })
  }
}
