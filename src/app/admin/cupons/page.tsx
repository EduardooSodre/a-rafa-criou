import { Metadata } from 'next'
import { Suspense } from 'react'
import CouponsPageClient from '@/components/admin/CouponsPageClient'

export const metadata: Metadata = {
    title: 'Cupons - Admin',
    description: 'Gerenciar cupons de desconto'
}

export default function CouponsPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <CouponsPageClient />
        </Suspense>
    )
}
