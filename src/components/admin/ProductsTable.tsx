'use client'

import { useState, useEffect } from 'react'
import { Edit, Trash2, Eye, FileText, ChevronDown, ChevronRight, Package2 } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [search, setSearch] = useState(externalSearch)
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'created'>('created')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [loading, setLoading] = useState(true)
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    // Sincronizar busca externa com estado interno
    useEffect(() => {
        setSearch(externalSearch)
    }, [externalSearch])

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

    useEffect(() => {
        const filtered = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.description?.toLowerCase().includes(search.toLowerCase())

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && product.isActive) ||
                (statusFilter === 'inactive' && !product.isActive)

            return matchesSearch && matchesStatus
        })

        // Ordenação
        filtered.sort((a, b) => {
            let aValue: string | number | Date, bValue: string | number | Date

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case 'price':
                    aValue = parseFloat(a.price)
                    bValue = parseFloat(b.price)
                    break
                case 'created':
                    aValue = a.createdAt
                    bValue = b.createdAt
                    break
                default:
                    aValue = a.createdAt
                    bValue = b.createdAt
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })

        setFilteredProducts(filtered)
    }, [products, search, statusFilter, sortBy, sortOrder])

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
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                Ativo
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
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
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="h-10 bg-gray-200 rounded animate-pulse flex-1" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse w-full sm:w-48" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse w-full sm:w-32" />
                </div>
                <div className="border rounded-lg">
                    <div className="h-12 bg-gray-100 border-b" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 border-b last:border-b-0 flex items-center px-4 gap-4">
                            <div className="h-12 w-12 bg-gray-200 rounded animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                            </div>
                            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
                    <p className="text-sm text-gray-600">Gerencie produtos e suas variações</p>
                </div>
                <Button asChild>
                    <Link href="/admin/products/new">
                        <Package2 className="mr-2 h-4 w-4" />
                        Novo Produto
                    </Link>
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />

                <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                    <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 shadow-sm hover:border-gray-400 focus:border-[#FED466] focus:ring-2 focus:ring-[#FED466]/20">
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="all" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Todos os status</SelectItem>
                        <SelectItem value="active" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Ativos</SelectItem>
                        <SelectItem value="inactive" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Inativos</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-') as [typeof sortBy, typeof sortOrder]
                    setSortBy(field)
                    setSortOrder(order)
                }}>
                    <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 shadow-sm hover:border-gray-400 focus:border-[#FED466] focus:ring-2 focus:ring-[#FED466]/20">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="name-asc" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Nome (A-Z)</SelectItem>
                        <SelectItem value="name-desc" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Nome (Z-A)</SelectItem>
                        <SelectItem value="price-asc" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Preço (Menor)</SelectItem>
                        <SelectItem value="price-desc" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Preço (Maior)</SelectItem>
                        <SelectItem value="created-desc" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Mais recentes</SelectItem>
                        <SelectItem value="created-asc" className="hover:bg-gray-50 focus:bg-[#FED466]/10">Mais antigos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

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
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    {search || statusFilter !== 'all' ? 'Nenhum produto encontrado com os filtros aplicados.' : 'Nenhum produto cadastrado ainda.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
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
                                                    <div className="bg-muted/50 p-4">
                                                        <h4 className="font-semibold mb-3 text-sm">
                                                            Variações ({product.variations.length})
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {product.variations.map((variation) => (
                                                                <div
                                                                    key={variation.id}
                                                                    className="flex items-center justify-between p-3 bg-background rounded border"
                                                                >
                                                                    <div className="flex-1 grid grid-cols-4 gap-4">
                                                                        <div>
                                                                            <span className="font-medium">{variation.name}</span>
                                                                            <p className="text-sm text-muted-foreground font-mono">{variation.slug}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-medium">{formatPrice(variation.price)}</span>
                                                                        </div>
                                                                        <div>
                                                                            <Badge variant={variation.isActive ? "default" : "secondary"} className="text-xs">
                                                                                {variation.isActive ? "Ativo" : "Inativo"}
                                                                            </Badge>
                                                                        </div>
                                                                        <div>
                                                                            {variation.files && variation.files.length > 0 && (
                                                                                <div className="text-sm">
                                                                                    <FileText className="inline h-3 w-3 mr-1" />
                                                                                    {variation.files.length} arquivo{variation.files.length > 1 ? 's' : ''}
                                                                                    {variation.files.map((file) => (
                                                                                        <div key={file.id} className="text-xs text-muted-foreground">
                                                                                            {file.originalName} ({formatFileSize(file.size)})
                                                                                        </div>
                                                                                    ))}
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
                                                                                <Button variant="outline" size="sm">
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
            {filteredProducts.length > 0 && (
                <div className="text-sm text-gray-600">
                    Mostrando {filteredProducts.length} de {products.length} produto(s)
                </div>
            )}
        </div>
    )
}