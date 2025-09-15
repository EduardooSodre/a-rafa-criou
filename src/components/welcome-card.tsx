'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function WelcomeCard() {
    return (
        <div className='rounded-lg border bg-card p-6 shadow-sm'>
            <h2 className='mb-4 text-2xl font-semibold text-foreground'>
                🚀 Bem-vindo ao A Rafa Criou!
            </h2>
            <p className='mb-6 text-muted-foreground'>
                Base do projeto configurada com sucesso. Ready para desenvolvimento!
            </p>

            <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                    <div className='rounded-md bg-primary/10 p-4'>
                        <h3 className='font-medium text-primary'>✅ Configurado</h3>
                        <ul className='mt-2 space-y-1 text-sm text-muted-foreground'>
                            <li>• Next.js + TypeScript</li>
                            <li>• Tailwind + Shadcn UI</li>
                            <li>• Drizzle + PostgreSQL</li>
                            <li>• Auth.js configurado</li>
                        </ul>
                    </div>

                    <div className='rounded-md bg-secondary/10 p-4'>
                        <h3 className='font-medium text-secondary'>🔄 Próximos Passos</h3>
                        <ul className='mt-2 space-y-1 text-sm text-muted-foreground'>
                            <li>• Configurar banco de dados</li>
                            <li>• Criar páginas de auth</li>
                            <li>• Implementar catálogo</li>
                            <li>• Sistema de pagamentos</li>
                        </ul>
                    </div>
                </div>

                <div className='flex gap-3'>
                    <Button asChild className='bg-primary hover:bg-secondary'>
                        <Link href='/auth/login'>
                            Fazer Login
                        </Link>
                    </Button>
                    <Button asChild variant='outline'>
                        <Link href='/auth/register'>
                            Criar Conta
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}