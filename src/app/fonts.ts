// app/fonts.ts
import { Dancing_Script } from 'next/font/google';

export const scripter = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-scripter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
});
