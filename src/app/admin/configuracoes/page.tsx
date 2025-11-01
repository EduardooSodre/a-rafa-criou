import { Suspense } from 'react'
import SettingsPageClient from '@/components/admin/SettingsPageClient'

export const metadata = {
    title: 'Configurações - Admin',
    description: 'Gerenciar configurações do sistema',
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SettingsPageClient />
        </Suspense>
    )
}
