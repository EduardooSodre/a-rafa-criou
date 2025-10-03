'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { status } = useSession();

    // Redirecionar usuários já autenticados para a home
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validações básicas
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            setIsLoading(false);
            return;
        }

        try {
            // TODO: Implementar registro de usuário via API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (response.ok) {
                router.push('/auth/login?message=Conta criada com sucesso!');
            } else {
                const data = await response.json();
                setError(data.error || 'Erro ao criar conta.');
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
                        Criar Conta
                    </CardTitle>
                    <CardDescription>
                        Junte-se à A Rafa Criou e acesse conteúdos exclusivos
                    </CardDescription>
                </CardHeader>

                <CardContent className='space-y-6'>
                    {error && (
                        <div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='name'>Nome completo</Label>
                            <Input
                                id='name'
                                name='name'
                                type='text'
                                value={formData.name}
                                onChange={handleChange}
                                placeholder='Seu nome completo'
                                required
                                className='h-11'
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='email'>E-mail</Label>
                            <Input
                                id='email'
                                name='email'
                                type='email'
                                value={formData.email}
                                onChange={handleChange}
                                placeholder='seu@email.com'
                                required
                                className='h-11'
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='password'>Senha</Label>
                            <Input
                                id='password'
                                name='password'
                                type='password'
                                value={formData.password}
                                onChange={handleChange}
                                placeholder='••••••••'
                                required
                                minLength={6}
                                className='h-11'
                            />
                            <p className='text-xs text-muted-foreground'>
                                Mínimo de 6 caracteres
                            </p>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='confirmPassword'>Confirmar senha</Label>
                            <Input
                                id='confirmPassword'
                                name='confirmPassword'
                                type='password'
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                            {isLoading ? 'Criando conta...' : 'Criar conta'}
                        </Button>
                    </form>

                    <div className='text-center text-sm text-muted-foreground'>
                        Já tem uma conta?{' '}
                        <Link href='/auth/login' className='text-primary hover:underline'>
                            Fazer login
                        </Link>
                    </div>

                    <div className='rounded-md bg-muted/50 p-4 text-xs text-muted-foreground'>
                        <strong>Nota:</strong> Página em desenvolvimento. O registro ainda não está implementado no backend.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}