'use client'

import { useState, useEffect } from 'react'
import { Edit, Trash2, Eye, FileText, ChevronDown, ChevronRight, Plus } from 'lucide-react'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import Link from 'next/link'

interface ProductFile {
    id: string
    name: string
    originalName: string
    mimeType: string
    size: number
    path: string
    hash?: string
    createdAt: Date
}

interface ProductVariation {
    id: string
    productId: string
    name: string
    slug: string
    price: string
    isActive: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    files?: ProductFile[]
}

interface Product {
    id: string
    name: string
    slug: string
    description: string | null
    shortDescription: string | null
    price: string // decimal como string
    categoryId: string | null
    isActive: boolean
    isFeatured: boolean
    seoTitle: string | null
    seoDescription: string | null
    createdAt: Date
    updatedAt: Date
    files?: ProductFile[]
    variations?: ProductVariation[]
}

interface ProductsTableProps {
    search?: string
    page?: number
    category?: string
}

export default function ProductsTable({ search: externalSearch = '', page = 1, category = '' }: ProductsTableProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    useEffect(() => {
        // Buscar produtos reais da API com variações
        async function fetchProducts() {
            try {
                const params = new URLSearchParams()
                if (externalSearch) params.append('search', externalSearch)
                if (category) params.append('category', category)
                if (page > 1) params.append('page', page.toString())
                params.append('include', 'variations,files') // Incluir variações e arquivos

                const queryString = params.toString()
                const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`

                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error('Erro ao buscar produtos')
                }
                const data = await response.json()
                setProducts(data.products || data) // API pode retornar { products: [] } ou []
                setLoading(false)
            } catch (error) {
                console.error('Erro ao buscar produtos:', error)
                // Em caso de erro, não mostrar dados mock - apenas lista vazia
                setProducts([])
                setLoading(false)
            }
        }

        fetchProducts()
    }, [externalSearch, category, page]) // Recarregar quando os filtros mudarem

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Erro ao deletar produto')
            }

            // Remover da lista local
            setProducts(products.filter(p => p.id !== id))
            console.log('Produto deletado com sucesso:', id)
        } catch (error) {
            console.error('Erro ao deletar produto:', error)
            alert('Erro ao deletar produto. Tente novamente.')
        }
    }

    const handleDeleteVariation = async (variationId: string, productId: string) => {
        try {
            const response = await fetch(`/api/admin/products/${productId}/variations/${variationId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Erro ao deletar variação')
            }

            // Remover a variação da lista local
            setProducts(products.map(product => {
                if (product.id === productId) {
                    return {
                        ...product,
                        variations: product.variations?.filter(v => v.id !== variationId)
                    }
                }
                return product
            }))
            console.log('Variação deletada com sucesso:', variationId)
        } catch (error) {
            console.error('Erro ao deletar variação:', error)
            alert('Erro ao deletar variação. Tente novamente.')
        }
    }

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white border-green-500">
                Ativo
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                Inativo
            </Badge>
        )
    }

    const formatPrice = (price: string) => {
        const numPrice = parseFloat(price)
        return `R$ ${numPrice.toFixed(2).replace('.', ',')}`
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const toggleRow = (productId: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(productId)) {
            newExpanded.delete(productId)
        } else {
            newExpanded.add(productId)
        }
        setExpandedRows(newExpanded)
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="w-12"></TableHead>
                                <TableHead className="w-16">Produto</TableHead>
                                <TableHead>Informações</TableHead>
                                <TableHead className="w-24">Preço</TableHead>
                                <TableHead className="w-20">Status</TableHead>
                                <TableHead className="w-32">Arquivos</TableHead>
                                <TableHead className="w-32 text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-12 w-12 bg-gray-200 rounded animate-pulse" /></TableCell>
                                    <TableCell>
                                        <div className="space-y-2">
                                            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </TableCell>
                                    <TableCell><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Tabela */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="w-16">Produto</TableHead>
                            <TableHead>Informações</TableHead>
                            <TableHead className="w-24">Preço</TableHead>
                            <TableHead className="w-20">Status</TableHead>
                            <TableHead className="w-32">Arquivos</TableHead>
                            <TableHead className="w-32 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-3 bg-gray-100 rounded-full">
                                            <FileText className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-medium text-gray-900">
                                                {externalSearch || category ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {externalSearch || category 
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
                                    <TableRow className="hover:bg-gray-50">
                                        <TableCell className="p-4">
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleRow(product.id)}
                                                    disabled={!product.variations?.length}
                                                >
                                                    {product.variations?.length ? (
                                                        expandedRows.has(product.id) ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )
                                                    ) : null}
                                                </Button>
                                            </CollapsibleTrigger>
                                        </TableCell>

                                        <TableCell className="p-4">
                                            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                                                <FileText className="w-6 h-6 text-gray-600" />
                                            </div>
                                        </TableCell>

                                        <TableCell className="p-4">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{product.name}</h3>
                                                <p className="text-sm text-gray-600">{product.slug}</p>
                                                {product.isFeatured && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        Destaque
                                                    </Badge>
                                                )}
                                                {product.variations && product.variations.length > 0 && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {product.variations.length} variação(ões)
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="p-4">
                                            <p className="font-medium">{formatPrice(product.price)}</p>
                                        </TableCell>

                                        <TableCell className="p-4">
                                            {getStatusBadge(product.isActive)}
                                        </TableCell>

                                        <TableCell className="p-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">{product.files?.length || 0} arquivo(s)</p>
                                                {product.files && product.files.length > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        {formatFileSize(product.files.reduce((acc, file) => acc + file.size, 0))}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={`/admin/products/${product.id}`}>
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={`/admin/products/${product.id}/edit`}>
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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

                                    {/* Linha expansível com variações */}
                                    {product.variations && product.variations.length > 0 && (
                                        <CollapsibleContent asChild>
                                            <TableRow>
                                                <TableCell colSpan={7} className="p-0">
                                                    <div className="bg-slate-50 border-t p-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="font-semibold text-sm text-gray-900">
                                                                Variações ({product.variations.length})
                                                            </h4>
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/admin/products/${product.id}/variations/new`}>
                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                    Nova Variação
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                        <div className="grid gap-3">
                                                            {product.variations.map((variation) => (
                                                                <div
                                                                    key={variation.id}
                                                                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                                                >
                                                                    <div className="flex-1 grid grid-cols-4 gap-6">
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">{variation.name}</div>
                                                                            <div className="text-sm text-gray-500 font-mono">{variation.slug}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-semibold text-lg text-gray-900">{formatPrice(variation.price)}</div>
                                                                        </div>
                                                                        <div>
                                                                            <Badge 
                                                                                variant={variation.isActive ? "default" : "secondary"} 
                                                                                className={variation.isActive 
                                                                                    ? "bg-green-500 text-white border-green-500" 
                                                                                    : "bg-red-100 text-red-800 border-red-200"
                                                                                }
                                                                            >
                                                                                {variation.isActive ? "Ativo" : "Inativo"}
                                                                            </Badge>
                                                                        </div>
                                                                        <div>
                                                                            {variation.files && variation.files.length > 0 ? (
                                                                                <div className="text-sm">
                                                                                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                                                                                        <FileText className="h-3 w-3" />
                                                                                        {variation.files.length} arquivo{variation.files.length > 1 ? 's' : ''}
                                                                                    </div>
                                                                                    <div className="mt-1 space-y-1">
                                                                                        {variation.files.slice(0, 2).map((file) => (
                                                                                            <div key={file.id} className="text-xs text-gray-600">
                                                                                                {file.originalName} ({formatFileSize(file.size)})
                                                                                            </div>
                                                                                        ))}
                                                                                        {variation.files.length > 2 && (
                                                                                            <div className="text-xs text-gray-400">
                                                                                                +{variation.files.length - 2} mais
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-sm text-gray-400">
                                                                                    Nenhum arquivo
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button variant="outline" size="sm" asChild>
                                                                            <Link href={`/admin/products/${product.id}/variations/${variation.id}/edit`}>
                                                                                <Edit className="h-3 w-3" />
                                                                            </Link>
                                                                        </Button>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                                                                    <Trash2 className="h-3 w-3" />
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

            {/* Resumo */}
            {products.length > 0 && (
                <div className="text-sm text-gray-600">
                    Mostrando {products.length} produto(s)
                </div>
            )}
        </div>
    )
}