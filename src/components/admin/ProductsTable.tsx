'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
    Edit,
    Eye,
    Trash2,
    ChevronDown,
    ChevronRight,
    FileText,
    Plus,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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

export default function ProductsTableClean({
    search = '',
    category = '',
    page = 1,
    onRefresh
}: ProductsTableProps) {
    const [products, setProducts] = useState<ProductData[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedRows, setExpandedRows] = useState(new Set<string>())
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
                params.append('include', 'variations,files') // Include variations and files

                const queryString = params.toString()
                const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`

                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error('Erro ao buscar produtos')
                }
                const data = await response.json()
                setProducts(data.products || data) // API may return { products: [] } or []
            } catch (error) {
                console.error('Erro ao buscar produtos:', error)
                setProducts([])
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [search, category, page]) // Reload when filters change

    const toggleRow = useCallback((productId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev)
            if (newSet.has(productId)) {
                newSet.delete(productId)
            } else {
                newSet.add(productId)
            }
            return newSet
        })
    }, [])

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

    const getStatusBadge = (isActive: boolean) => (
        <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }
        >
            {isActive ? "Ativo" : "Inativo"}
        </Badge>
    )

    const handleDelete = async (productId: string) => {
        try {
            setDeletingProduct(productId)
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Erro ao excluir produto')
            }

            // Refresh products list
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (category) params.append('category', category)
            if (page > 1) params.append('page', page.toString())
            params.append('include', 'variations,files')

            const queryString = params.toString()
            const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`

            const refreshResponse = await fetch(url)
            if (refreshResponse.ok) {
                const data = await refreshResponse.json()
                setProducts(data.products || data)
            }

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

            // Refresh products list
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (category) params.append('category', category)
            if (page > 1) params.append('page', page.toString())
            params.append('include', 'variations,files')

            const queryString = params.toString()
            const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`

            const refreshResponse = await fetch(url)
            if (refreshResponse.ok) {
                const data = await refreshResponse.json()
                setProducts(data.products || data)
            }

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
            <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Tabela Principal */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/80 border-b border-gray-200">
                            <TableHead className="w-10 text-center font-medium text-gray-700">
                                {/* Expand/Collapse */}
                            </TableHead>
                            <TableHead className="min-w-[320px] font-medium text-gray-700">
                                Produto
                            </TableHead>
                            <TableHead className="w-28 text-center font-medium text-gray-700">
                                Preço
                            </TableHead>
                            <TableHead className="w-24 text-center font-medium text-gray-700">
                                Status
                            </TableHead>
                            <TableHead className="w-28 text-center font-medium text-gray-700">
                                Arquivos
                            </TableHead>
                            <TableHead className="w-32 text-center font-medium text-gray-700">
                                Ações
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!products || products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="rounded-full bg-gray-100 p-4">
                                            <FileText className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {search || category ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                                            </h3>
                                            <p className="text-sm text-gray-500 max-w-sm">
                                                {search || category
                                                    ? 'Tente ajustar os filtros para encontrar produtos.'
                                                    : 'Comece criando seu primeiro produto digital.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <Collapsible key={product.id} open={expandedRows.has(product.id)}>
                                    {/* Linha Principal do Produto */}
                                    <TableRow className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                                        {/* Botão de Expansão */}
                                        <TableCell className="text-center">
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleRow(product.id)}
                                                    disabled={!product.variations?.length}
                                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                                >
                                                    {product.variations?.length ? (
                                                        expandedRows.has(product.id) ? (
                                                            <ChevronDown className="h-4 w-4 text-gray-600" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-gray-600" />
                                                        )
                                                    ) : (
                                                        <div className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </CollapsibleTrigger>
                                        </TableCell>

                                        {/* Informações do Produto */}
                                        <TableCell className="py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                                        <FileText className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 font-mono truncate">
                                                        {product.slug}
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        {product.isFeatured && (
                                                            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border-yellow-200">
                                                                ⭐ Destaque
                                                            </Badge>
                                                        )}
                                                        {product.variations && product.variations.length > 0 && (
                                                            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                                                {product.variations.length} variação{product.variations.length > 1 ? 'ões' : 'ão'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Preço */}
                                        <TableCell className="text-center">
                                            <div className="font-semibold text-lg text-gray-900">
                                                {formatPrice(product.price)}
                                            </div>
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell className="text-center">
                                            {getStatusBadge(product.isActive)}
                                        </TableCell>

                                        {/* Arquivos */}
                                        <TableCell className="text-center">
                                            <div className="space-y-1">
                                                <div className="font-medium text-gray-900">
                                                    {product.files?.length || 0}
                                                </div>
                                                {product.files && product.files.length > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        {formatFileSize(product.files.reduce((acc, file) => acc + file.size, 0))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Ações */}
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50" asChild>
                                                    <Link href={`/admin/products/${product.id}`}>
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100" asChild>
                                                    <Link href={`/admin/products/${product.id}/edit`}>
                                                        <Edit className="h-4 w-4 text-gray-600" />
                                                    </Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
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
                                        </TableCell>
                                    </TableRow>

                                    {/* Seção Expandida com Variações */}
                                    {product.variations && product.variations.length > 0 && (
                                        <CollapsibleContent asChild>
                                            <TableRow>
                                                <TableCell colSpan={6} className="p-0 bg-gray-50/30">
                                                    <div className="px-6 py-6 border-t border-gray-100">
                                                        {/* Header das Variações */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-base font-semibold text-gray-900">
                                                                Variações ({product.variations.length})
                                                            </h4>
                                                            <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50" asChild>
                                                                <Link href={`/admin/products/${product.id}/variations/new`}>
                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                    Nova Variação
                                                                </Link>
                                                            </Button>
                                                        </div>

                                                        {/* Lista de Variações */}
                                                        <div className="space-y-3">
                                                            {product.variations.map((variation) => (
                                                                <div
                                                                    key={variation.id}
                                                                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-150"
                                                                >
                                                                    <div className="grid flex-1 grid-cols-4 gap-6">
                                                                        {/* Nome e Slug */}
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">{variation.name}</div>
                                                                            <div className="text-sm text-gray-500 font-mono">{variation.slug}</div>
                                                                        </div>

                                                                        {/* Preço */}
                                                                        <div className="text-center">
                                                                            <div className="font-semibold text-lg text-gray-900">
                                                                                {formatPrice(variation.price)}
                                                                            </div>
                                                                        </div>

                                                                        {/* Status */}
                                                                        <div className="text-center">
                                                                            <Badge
                                                                                variant={variation.isActive ? "default" : "secondary"}
                                                                                className={variation.isActive
                                                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                                                    : "bg-red-100 text-red-800 border-red-200"
                                                                                }
                                                                            >
                                                                                {variation.isActive ? "Ativo" : "Inativo"}
                                                                            </Badge>
                                                                        </div>

                                                                        {/* Arquivos */}
                                                                        <div className="text-center">
                                                                            {variation.files && variation.files.length > 0 ? (
                                                                                <div className="space-y-1">
                                                                                    <div className="flex items-center justify-center space-x-1 text-blue-600">
                                                                                        <FileText className="h-4 w-4" />
                                                                                        <span className="font-medium">
                                                                                            {variation.files.length} arquivo{variation.files.length > 1 ? 's' : ''}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {formatFileSize(variation.files.reduce((acc, file) => acc + file.size, 0))}
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-sm text-gray-400">Sem arquivos</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Ações da Variação */}
                                                                    <div className="flex space-x-1 ml-4">
                                                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-gray-50" asChild>
                                                                            <Link href={`/admin/products/${product.id}/variations/${variation.id}/edit`}>
                                                                                <Edit className="h-4 w-4 text-gray-600" />
                                                                            </Link>
                                                                        </Button>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                                    disabled={deletingVariation === variation.id}
                                                                                >
                                                                                    {deletingVariation === variation.id ? (
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
                                                </TableCell>
                                            </TableRow>
                                        </CollapsibleContent>
                                    )}
                                </Collapsible>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer com Contagem */}
            {products && products.length > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-600 px-1">
                    <span>
                        Mostrando <span className="font-medium">{products.length}</span> produto{products.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-gray-400">
                        {products.filter(p => p.isActive).length} ativo{products.filter(p => p.isActive).length !== 1 ? 's' : ''} • {products.filter(p => !p.isActive).length} inativo{products.filter(p => !p.isActive).length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    )
}