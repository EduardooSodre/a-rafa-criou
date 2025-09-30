import { NextRequest, NextResponse } from 'next/server'
import { getR2SignedUrl } from '@/lib/r2-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const r2Key = searchParams.get('r2Key')
    if (!r2Key) return NextResponse.json({ error: 'Missing r2Key' }, { status: 400 })

    // Short TTL for preview links
    const ttl = 60 // seconds

    const signed = await getR2SignedUrl(String(r2Key), ttl)

    // Redirect the client to the signed URL so the browser can load the image
    return NextResponse.redirect(signed)
  } catch (err) {
    console.error('Error generating R2 signed URL:', err)
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
