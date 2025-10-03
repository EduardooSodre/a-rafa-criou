'use client'

import { useState, useEffect } from 'react'
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
    id: string
    name: string
    slug: string
    price: number
    description?: string
    mainImage: {
        data: string
        alt: string
    } | null
}

interface MobileSearchSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MobileSearchSheet({ open, onOpenChange }: MobileSearchSheetProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([])
            return
        }

        const timer = setTimeout(async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=20`)
                const data = await response.json()
                setResults(data.products || [])
            } catch (error) {
                console.error('Erro ao buscar produtos:', error)
                setResults([])
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const handleProductClick = () => {
        setSearchQuery('')
        setResults([])
        onOpenChange(false)
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[30vh] p-0 flex flex-col bg-[#FD9555] rounded-t-3xl border-0">
                <DrawerTitle className="sr-only">Buscar Produtos</DrawerTitle>
                
                {/* Header com Search Input */}
                <div className="p-4 pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 py-6 text-base bg-white rounded-xl"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="inline-block w-8 h-8 border-4 border-[#FD9555] border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-2 text-gray-500">Buscando...</p>
                        </div>
                    ) : searchQuery.trim() === '' ? (
                        <div className="text-center py-8">
                            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Digite para buscar produtos</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-2">Nenhum produto encontrado</p>
                            <p className="text-sm text-gray-400">Tente usar palavras-chave diferentes</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500 mb-3">
                                {results.length} {results.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                            </p>
                            {results.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/produtos/${product.slug}`}
                                    onClick={handleProductClick}
                                    className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors no-underline"
                                >
                                    {/* Image */}
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-md overflow-hidden">
                                        <Image
                                            src={product.mainImage?.data || '/placeholder.png'}
                                            alt={product.mainImage?.alt || product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-2">
                                            {product.name}
                                        </h3>
                                        {product.description && (
                                            <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                                                {product.description}
                                            </p>
                                        )}
                                        <p className="text-sm font-bold text-[#FD9555]">
                                            {formatPrice(product.price)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}
