"use client";

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();

    const { t } = useTranslation('common');

    // Redirecionar usuários já autenticados para a home
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        const message = searchParams.get('message');
        if (message) {
            setSuccessMessage(message);
        }
    }, [searchParams]);

    // Mostrar loading enquanto verifica a sessão
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Carregando...</p>
            </div>
        );
    }

    // Não renderizar o formulário se já estiver autenticado
    if (status === 'authenticated') {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Credenciais inválidas. Tente novamente.');
            } else {
                router.push('/'); // Redirect para homepage após login
                router.refresh();
            }
        } catch {
            setError('Erro interno. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='container mx-auto flex min-h-screen items-center justify-center p-6'>
            <Card className='w-full max-w-md'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-2xl font-bold text-foreground'>
                        {t('auth.loginTitle')}
                    </CardTitle>
                    <CardDescription>
                        {t('auth.loginSubtitle')}
                    </CardDescription>
                </CardHeader>

                <CardContent className='space-y-6'>
                    {successMessage && (
                        <Alert>
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='email'>{t('nav.login') === 'Entrar' ? 'E-mail' : 'E-mail'}</Label>
                            <Input
                                id='email'
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='seu@email.com'
                                required
                                className='h-11'
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='password'>{t('auth.password', 'Senha')}</Label>
                            <Input
                                id='password'
                                type='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder='••••••••'
                                required
                                className='h-11'
                            />
                        </div>

                        <Button
                            type='submit'
                            className='w-full bg-primary hover:bg-secondary'
                            disabled={isLoading}
                        >
                            {isLoading ? t('auth.loggingIn') : t('auth.login')}
                        </Button>
                    </form>

                    <div className='relative'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-muted' />
                        </div>
                        <div className='relative flex justify-center text-xs uppercase'>
                            <span className='bg-card px-2 text-muted-foreground'>Em breve</span>
                        </div>
                    </div>

                    <Button
                        type='button'
                        variant='outline'
                        className='w-full'
                        disabled={true}
                    >
                        Link Mágico (Em desenvolvimento)
                    </Button>

                    <div className='text-center text-sm text-muted-foreground'>
                        {t('auth.noAccount', 'Não tem uma conta?')}{' '}
                        <Link href='/auth/register' className='text-primary hover:underline'>
                            {t('auth.register')}
                        </Link>
                    </div>

                    {/* Login de teste para desenvolvimento */}
                    <div className='rounded-md bg-muted/50 p-4 text-xs text-muted-foreground'>
                        <strong>Acesso de teste:</strong>
                        <br />
                        E-mail: admin@arafacriou.com.br
                        <br />
                        Senha: admin123
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function LoginPage() {
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
            <LoginContent />
        </Suspense>
    );
}