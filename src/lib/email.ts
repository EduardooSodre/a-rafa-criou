import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY não está configurado nas variáveis de ambiente');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Allow overriding the sender address via FROM_EMAIL env var for testing or while domain is being verified.
// Default keeps the branded sender but won't work until domain is verified in Resend.
export const FROM_EMAIL = process.env.FROM_EMAIL || 'A Rafa Criou <arafacriou@gmail.com>';
