import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req) {
  const body = await req.json()
  const { username, role } = body
  const session = { username, role }
  const cookieStore = cookies()
  cookieStore.set('session', encodeURIComponent(JSON.stringify(session)), {
    httpOnly: true,
    path: '/',
    maxAge: 60*60*24*7
  })
  return NextResponse.json({ ok: true })
}
