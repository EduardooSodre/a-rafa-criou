'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function AuthTestPage() {
    const { data: session, status } = useSession();

    useEffect(() => {
        console.log('Session status:', status);
        console.log('Session data:', session);
    }, [session, status]);

    if (status === 'loading') {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
                <p>Carregando sessão...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>

            <div className="space-y-4">
                <div>
                    <strong>Status:</strong> {status}
                </div>

                {session ? (
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Usuário Autenticado:</h2>
                        <p><strong>ID:</strong> {session.user?.id}</p>
                        <p><strong>Email:</strong> {session.user?.email}</p>
                        <p><strong>Nome:</strong> {session.user?.name}</p>
                        <p><strong>Role:</strong> {session.user?.role}</p>
                    </div>
                ) : (
                    <div>
                        <p>Usuário não autenticado</p>
                        <a href="/auth/login" className="text-blue-500 hover:underline">
                            Fazer login
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}