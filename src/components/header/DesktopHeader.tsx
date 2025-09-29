'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Search, Instagram } from 'lucide-react'

interface DesktopHeaderProps {
    totalItems: number
}

export function DesktopHeader({ totalItems }: DesktopHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()
    const { t } = useTranslation('common')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/produtos?search=${encodeURIComponent(searchQuery)}`)
        }
    }

    return (
        <div className="bg-[#FED466] ">
            <div className="container mx-auto px-2 sm:px-4">
                <div className="hidden md:flex items-center justify-between">
                    {/* Desktop: Logo */}
                    <Link href="/" className="flex items-center gap-2 no-underline">
                        <Image
                            src="/logo.webp"
                            alt={t('siteTitle')}
                            width={200}
                            height={60}
                            className="h-14 sm:h-16 md:h-18 w-auto"
                        />
                    </Link>

                    {/* Desktop: Barra de busca central */}
                    <div className="flex-1 max-w-md sm:max-w-lg md:max-w-2xl mx-4 sm:mx-6 md:mx-8">
                        <form onSubmit={handleSearch} className="relative">
                            <Input
                                type="search"
                                placeholder={t('search.placeholder', 'O que você procura?')}
                                aria-label={t('search.ariaLabel', 'Buscar produtos')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 md:h-12 pl-4 pr-12 rounded-lg border-0 bg-white text-black placeholder:text-gray-500"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="absolute right-1 top-1 h-8 w-8 md:h-10 md:w-10 bg-[#FD9555] hover:bg-[#FD9555]/90 text-white rounded-lg"
                            >
                                <Search className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                        </form>
                    </div>

                    {/* Desktop: Carrinho + Instagram */}
                    <div className="flex items-center gap-2">
                        {/* Carrinho */}
                        <Button asChild variant="ghost" size="lg" className="relative bg-white/20 hover:bg-white/30 rounded-full p-6">
                            <Link href="/carrinho" className="no-underline">
                                <ShoppingCart className="w-5 h-5 text-black" />
                                {totalItems > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center p-0 text-xs bg-[#FD9555] text-white border-2 border-white rounded-full"
                                    >
                                        {totalItems}
                                    </Badge>
                                )}
                            </Link>
                        </Button>

                        {/* Instagram */}
                        <Link
                            href="https://instagram.com/arafacriou"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/20 rounded-full p-3 hover:bg-white/30 transition-colors no-underline"
                        >
                            <Instagram className="w-5 h-5 text-black" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}