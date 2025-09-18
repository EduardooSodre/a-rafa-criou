'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/header'

export function ConditionalHeader() {
    const pathname = usePathname()

    // Não mostrar header em rotas admin
    if (pathname?.startsWith('/admin')) {
        return null
    }

    return <Header />
}