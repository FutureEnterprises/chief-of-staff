import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

export async function GET() {
  try {
    const count = await prisma.user.count()
    return NextResponse.json({ ok: true, userCount: count })
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; name?: string; meta?: unknown }
    console.error('[debug-db] error:', JSON.stringify({ name: e?.name, code: e?.code, message: e?.message, meta: e?.meta }))
    return NextResponse.json({ ok: false, name: e?.name, code: e?.code, message: e?.message, meta: e?.meta }, { status: 500 })
  }
}
