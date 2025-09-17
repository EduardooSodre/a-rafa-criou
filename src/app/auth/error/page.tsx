'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

const errorMessages: Record<string, string> = {
    Configuration: 'Erro de configuração do servidor.',
    AccessDenied: 'Acesso negado. Você não tem permissão para acessar este recurso.',
    Verification: 'Token de verificação inválido ou expirado.',
    Default: 'Ocorreu um erro durante a autenticação.',
};

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error') || 'Default';
    const message = errorMessages[error] || errorMessages.Default;

    return (
        <div className='container mx-auto flex min-h-screen items-center justify-center p-6'>
            <Card className='w-full max-w-md'>
                <CardHeader className='text-center'>
                    <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
                        <AlertCircle className='h-6 w-6 text-destructive' />
                    </div>
                    <CardTitle className='text-2xl font-bold text-foreground'>
                        Erro de Autenticação
                    </CardTitle>
                    <CardDescription>
                        Algo deu errado durante o processo de autenticação
                    </CardDescription>
                </CardHeader>

                <CardContent className='space-y-6 text-center'>
                    <div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
                        {message}
                    </div>

                    <div className='space-y-3'>
                        <Button asChild className='w-full bg-primary hover:bg-secondary'>
                            <Link href='/auth/login'>
                                Tentar novamente
                            </Link>
                        </Button>

                        <Button asChild variant='outline' className='w-full'>
                            <Link href='/'>
                                Voltar ao início
                            </Link>
                        </Button>
                    </div>

                    <div className='text-xs text-muted-foreground'>
                        Se o problema persistir, entre em contato com o suporte.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className='container mx-auto flex min-h-screen items-center justify-center p-6'>
                <Card className='w-full max-w-md'>
                    <CardContent className='p-6 text-center'>
                        Carregando...
                    </CardContent>
                </Card>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}