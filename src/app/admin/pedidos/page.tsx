import { Metadata } from 'next'
import { Suspense } from 'react'
import OrdersPageClient from '@/components/admin/OrdersPageClient'

export const metadata: Metadata = {
    title: 'Pedidos - Admin',
    description: 'Gerenciar pedidos da loja'
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <OrdersPageClient />
        </Suspense>
    )
}
