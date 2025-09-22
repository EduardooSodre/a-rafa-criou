'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
    Edit, 
    Eye, 
    Trash2, 
    ChevronDown, 
    ChevronUp, 
    FileText, 
    Plus,
    Loader2,
    Package,
    DollarSign,
    Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface FileData {
    id: string
    originalName: string
    size: number
    mimeType: string
    cloudflareId?: string
}

interface VariationData {
    id: string
    name: string
    slug: string
    price: number
    isActive: boolean
    files?: FileData[]
}

interface ProductData {
    id: string
    name: string
    slug: string
    price: number
    isActive: boolean
    isFeatured: boolean
    files?: FileData[]
    variations?: VariationData[]
}

interface ProductsTableProps {
    search?: string
    category?: string
    page?: number
    onRefresh?: () => void
}

export default function ProductsCardsView({
    search = '',
    category = '',
    page = 1,
    onRefresh
}: ProductsTableProps) {
    const [products, setProducts] = useState<ProductData[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedCards, setExpandedCards] = useState(new Set<string>())
    const [deletingProduct, setDeletingProduct] = useState<string | null>(null)
    const [deletingVariation, setDeletingVariation] = useState<string | null>(null)

    // Fetch products from API
    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true)
                const params = new URLSearchParams()
                if (search) params.append('search', search)
                if (category) params.append('category', category)
                if (page > 1) params.append('page', page.toString())
                params.append('include', 'variations,files')

                const queryString = params.toString()
                const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`

                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error('Erro ao buscar produtos')
                }
                const data = await response.json()
                setProducts(data.products || data)
            } catch (error) {
                console.error('Erro ao buscar produtos:', error)
                setProducts([])
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [search, category, page])

    const toggleCard = (productId: string) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev)
            if (newSet.has(productId)) {
                newSet.delete(productId)
            } else {
                newSet.add(productId)
            }
            return newSet
        })
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const refreshProducts = async () => {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (category) params.append('category', category)
        if (page > 1) params.append('page', page.toString())
        params.append('include', 'variations,files')

        const queryString = params.toString()
        const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`

        try {
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setProducts(data.products || data)
            }
        } catch (error) {
            console.error('Erro ao atualizar produtos:', error)
        }
    }

    const handleDelete = async (productId: string) => {
        try {
            setDeletingProduct(productId)
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Erro ao excluir produto')
            }

            await refreshProducts()
            onRefresh?.()
        } catch (error) {
            console.error('Erro ao excluir produto:', error)
            alert('Erro ao excluir produto. Tente novamente.')
        } finally {
            setDeletingProduct(null)
        }
    }

    const handleDeleteVariation = async (variationId: string, productId: string) => {
        try {
            setDeletingVariation(variationId)
            const response = await fetch(`/api/admin/products/${productId}/variations/${variationId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Erro ao excluir variação')
            }

            await refreshProducts()
            onRefresh?.()
        } catch (error) {
            console.error('Erro ao excluir variação:', error)
            alert('Erro ao excluir variação. Tente novamente.')
        } finally {
            setDeletingVariation(null)
        }
    }

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-full bg-gray-100 p-6">
                        <Package className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {search || category ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                        </h3>
                        <p className="text-gray-500 max-w-md">
                            {search || category
                                ? 'Tente ajustar os filtros para encontrar produtos.'
                                : 'Comece criando seu primeiro produto digital.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Grid de Cards */}
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="text-base font-semibold text-gray-900 truncate">
                                            {product.name}
                                        </CardTitle>
                                        <p className="text-sm text-gray-500 font-mono truncate">
                                            {product.slug}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Status Badge */}
                                <Badge
                                    variant={product.isActive ? "default" : "secondary"}
                                    className={`ml-2 flex-shrink-0 ${product.isActive 
                                        ? "bg-green-100 text-green-800 border-green-200" 
                                        : "bg-red-100 text-red-800 border-red-200"
                                    }`}
                                >
                                    {product.isActive ? "Ativo" : "Inativo"}
                                </Badge>
                            </div>

                            {/* Tags Row */}
                            <div className="flex items-center gap-2 pt-2">
                                {product.isFeatured && (
                                    <Badge variant="outline" className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                                        <Star className="h-3 w-3 mr-1" />
                                        Destaque
                                    </Badge>
                                )}
                                {product.variations && product.variations.length > 0 && (
                                    <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                                        {product.variations.length} variação{product.variations.length > 1 ? 'ões' : 'ão'}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            {/* Price Section */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    <span className="text-xl font-bold text-gray-900">
                                        {formatPrice(product.price)}
                                    </span>
                                </div>
                                
                                {/* Files Info */}
                                <div className="text-right">
                                    <div className="flex items-center justify-end space-x-1 text-blue-600">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                            {product.files?.length || 0}
                                        </span>
                                    </div>
                                    {product.files && product.files.length > 0 && (
                                        <div className="text-xs text-gray-500">
                                            {formatFileSize(product.files.reduce((acc, file) => acc + file.size, 0))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between">
                                <div className="flex space-x-1">
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50" asChild>
                                        <Link href={`/admin/products/${product.id}`}>
                                            <Eye className="h-4 w-4 text-blue-600" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100" asChild>
                                        <Link href={`/admin/products/${product.id}/edit`}>
                                            <Edit className="h-4 w-4 text-gray-600" />
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                disabled={deletingProduct === product.id}
                                            >
                                                {deletingProduct === product.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja excluir o produto &quot;{product.name}&quot;?
                                                    Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(product.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Excluir
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                {/* Expand Variations Button */}
                                {product.variations && product.variations.length > 0 && (
                                    <Collapsible>
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleCard(product.id)}
                                                className="text-xs"
                                            >
                                                {expandedCards.has(product.id) ? (
                                                    <>
                                                        <ChevronUp className="h-3 w-3 mr-1" />
                                                        Ocultar
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="h-3 w-3 mr-1" />
                                                        Ver Variações
                                                    </>
                                                )}
                                            </Button>
                                        </CollapsibleTrigger>
                                    </Collapsible>
                                )}
                            </div>

                            {/* Variations Section */}
                            {product.variations && product.variations.length > 0 && (
                                <Collapsible open={expandedCards.has(product.id)}>
                                    <CollapsibleContent className="mt-4">
                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-semibold text-gray-900">
                                                    Variações ({product.variations.length})
                                                </h4>
                                                <Button variant="outline" size="sm" className="text-xs" asChild>
                                                    <Link href={`/admin/products/${product.id}/variations/new`}>
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Nova
                                                    </Link>
                                                </Button>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {product.variations.map((variation) => (
                                                    <div
                                                        key={variation.id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {variation.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 font-mono truncate">
                                                                        {variation.slug}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center space-x-3 ml-4">
                                                                    <div className="text-right">
                                                                        <div className="font-semibold text-gray-900">
                                                                            {formatPrice(variation.price)}
                                                                        </div>
                                                                        <div className="flex items-center justify-end space-x-1">
                                                                            <Badge
                                                                                variant={variation.isActive ? "default" : "secondary"}
                                                                                className={`text-xs ${variation.isActive
                                                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                                                    : "bg-red-100 text-red-800 border-red-200"
                                                                                }`}
                                                                            >
                                                                                {variation.isActive ? "Ativo" : "Inativo"}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Files for variation */}
                                                            {variation.files && variation.files.length > 0 && (
                                                                <div className="mt-2 flex items-center space-x-2">
                                                                    <FileText className="h-3 w-3 text-blue-600" />
                                                                    <span className="text-xs text-blue-600">
                                                                        {variation.files.length} arquivo{variation.files.length > 1 ? 's' : ''}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        ({formatFileSize(variation.files.reduce((acc, file) => acc + file.size, 0))})
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Variation Actions */}
                                                        <div className="flex space-x-1 ml-3">
                                                            <Button variant="outline" size="sm" className="h-7 w-7 p-0" asChild>
                                                                <Link href={`/admin/products/${product.id}/variations/${variation.id}/edit`}>
                                                                    <Edit className="h-3 w-3" />
                                                                </Link>
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                        disabled={deletingVariation === variation.id}
                                                                    >
                                                                        {deletingVariation === variation.id ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-3 w-3" />
                                                                        )}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Tem certeza que deseja excluir a variação &quot;{variation.name}&quot;? Esta ação não pode ser desfeita.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteVariation(variation.id, product.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Excluir
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Footer com Estatísticas */}
            {products && products.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600">
                            Mostrando <span className="font-medium">{products.length}</span> produto{products.length > 1 ? 's' : ''}
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                {products.filter(p => p.isActive).length} ativo{products.filter(p => p.isActive).length !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                {products.filter(p => !p.isActive).length} inativo{products.filter(p => !p.isActive).length !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                {products.filter(p => p.isFeatured).length} destaque{products.filter(p => p.isFeatured).length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}