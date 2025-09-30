import { S3Client } from '@aws-sdk/client-s3';

// Check for required R2 env vars but avoid throwing during module evaluation.
const missing: string[] = []
if (!process.env.R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID')
if (!process.env.R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID')
if (!process.env.R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY')

export const R2_BUCKET = process.env.R2_BUCKET || 'pdfs'

let r2Client: S3Client
if (missing.length === 0) {
  r2Client = new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
} else {
  // Provide a stub that throws only when used. This prevents import-time crashes while
  // giving a clear runtime error if any R2 operation is attempted without proper env.
  // We cast to S3Client to keep consumers' typings unchanged.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stub: any = {
    async send() {
      throw new Error(`Cloudflare R2 is not configured. Missing env: ${missing.join(', ')}`)
    }
  }
  r2Client = stub as S3Client
  // Log a developer-friendly warning
  console.warn(`Warning: Cloudflare R2 not configured. Missing env: ${missing.join(', ')}. R2 operations will fail if called.`)
}

export const r2 = r2Client
