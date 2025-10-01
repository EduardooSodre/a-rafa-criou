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
    // Fetch the signed URL and stream the response back to the client.
    // This avoids redirect-following issues when the Next/Image optimizer requests the URL.
    const fetched = await fetch(signed)
    if (!fetched.ok) {
      console.error('Failed to fetch signed URL:', fetched.status, await fetched.text())
      return NextResponse.json({ error: 'Failed to fetch file from storage' }, { status: 502 })
    }

    // Validate content-type (basic guard)
    const contentType = fetched.headers.get('content-type') || 'application/octet-stream'
    if (!contentType.startsWith('image/') && !contentType.startsWith('application/pdf')) {
      console.warn('Requested resource is not an image/pdf:', contentType)
      // Still proxy it, but clients that expect an image may complain; return 415 to be explicit
      return NextResponse.json({ error: 'Resource is not an image or pdf' }, { status: 415 })
    }

    const body = await fetched.arrayBuffer()
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      // short cache for signed preview
      'Cache-Control': `public, max-age=${Math.max(0, Math.min(60, ttl))}`,
    }

    return new NextResponse(Buffer.from(body), { headers })
  } catch (err) {
    console.error('Error generating R2 signed URL:', err)
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
