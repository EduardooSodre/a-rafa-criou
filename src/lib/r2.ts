import { S3Client } from '@aws-sdk/client-s3';

if (!process.env.R2_ACCOUNT_ID) {
  throw new Error('R2_ACCOUNT_ID is not defined');
}

if (!process.env.R2_ACCESS_KEY_ID) {
  throw new Error('R2_ACCESS_KEY_ID is not defined');
}

if (!process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('R2_SECRET_ACCESS_KEY is not defined');
}

export const r2 = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET || 'pdfs';
