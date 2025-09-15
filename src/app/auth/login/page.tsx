'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signIn('email', { email, redirect: false });
      // TODO: Mostrar mensagem de sucesso
      alert('Link mágico enviado! Verifique seu e-mail.');
    } catch (error) {
      console.error('Erro no magic link:', error);
      setError('Erro ao enviar link mágico. Tente novamente.');
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
          {error && (
            <div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
              {error}
            </div>
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
              <span className='bg-card px-2 text-muted-foreground'>ou</span>
            </div>
          </div>

          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={handleMagicLink}
            disabled={!email || isLoading}
          >
            Receber link por e-mail
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