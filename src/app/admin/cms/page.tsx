import { Suspense } from 'react'
import CMSPageClient from '@/components/admin/CMSPageClient'

export const metadata = {
    title: 'CMS - Admin',
    description: 'Gerenciar conteúdo das páginas',
}

export default function CMSPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <CMSPageClient />
        </Suspense>
    )
}
