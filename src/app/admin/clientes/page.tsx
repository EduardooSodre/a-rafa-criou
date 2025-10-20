import { Metadata } from 'next'
import { Suspense } from 'react'
import UsersPageClient from '@/components/admin/UsersPageClient'

export const metadata: Metadata = {
    title: 'Clientes - Admin',
    description: 'Clientes cadastrados'
}

export default function ClientesPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <UsersPageClient />
        </Suspense>
    )
}
