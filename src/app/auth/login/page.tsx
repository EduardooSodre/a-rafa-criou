'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const message = searchParams.get('message');
        if (message) {
            setSuccessMessage(message);
        }
    }, [searchParams]);

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
                        Entrar na A Rafa Criou
                    </CardTitle>
                    <CardDescription>
                        Acesse sua conta para continuar comprando
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
                            <Label htmlFor='email'>E-mail</Label>
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
                            <Label htmlFor='password'>Senha</Label>
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
                            {isLoading ? 'Entrando...' : 'Entrar'}
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
                        Não tem uma conta?{' '}
                        <Link href='/auth/register' className='text-primary hover:underline'>
                            Criar conta
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