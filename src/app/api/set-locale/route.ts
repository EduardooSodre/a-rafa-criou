import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const locale = String(body.locale || 'pt')
    const redirectTo = String(body.redirectTo || '/')

    const res = NextResponse.json({ ok: true, redirectTo })
    // Set cookie for 1 year
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
