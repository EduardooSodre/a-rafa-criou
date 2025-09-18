import { Metadata } from 'next'
import { Suspense } from 'react'
import UsersPageClient from '@/components/admin/UsersPageClient'

export const metadata: Metadata = {
    title: 'Gerenciar Usuários - A Rafa Criou Admin',
    description: 'Gerenciar usuários e permissões administrativas'
}

export default function UsersPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <UsersPageClient />
        </Suspense>
    )
}