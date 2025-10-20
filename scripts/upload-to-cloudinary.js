import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = process.env.CLOUDINARY_FOLDER || '';

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Missing Cloudinary env vars. Check .env.local');
  process.exit(1);
}

async function upload() {
  const filePath = path.resolve(process.cwd(), 'public', 'mascote_raquel3.webp');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });

  console.log('Uploading', filePath, 'to Cloudinary...');

  try {
    const res = await cloudinary.uploader.upload(filePath, {
      folder: FOLDER || undefined,
      public_id: 'mascote_raquel3',
      overwrite: true,
      resource_type: 'image',
    });

    console.log('Upload successful!');
    console.log('secure_url:', res.secure_url);
    console.log(
      '\nCopy that URL to NEXT_PUBLIC_MASCOTE_URL in your .env.local and restart the dev server.'
    );
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    process.exit(1);
  }
}

upload();
