'use client'

import { useState, useEffect } from 'react'
import { Edit, Trash2, Eye, FileText } from 'lucide-react'
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
import Link from 'next/link'

interface Product {
    id: string
    name: string
    slug: string
    description: string | null
    shortDescription: string | null
    price: string // decimal como string
    isActive: boolean
    isFeatured: boolean
    seoTitle: string | null
    seoDescription: string | null
    createdAt: Date
    updatedAt: Date
    files: Array<{
        id: string
        name: string
        originalName: string
        mimeType: string
        size: number
        path: string
    }>
    variations?: Array<{
        id: string
        name: string
        slug: string
        price: string
        isActive: boolean
    }>
}

// TODO: Substituir por dados reais do banco
const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Planner Digital 2024',
        slug: 'planner-digital-2024',
        description: 'Planner completo para organização pessoal e profissional',
        shortDescription: 'Organize seu ano com este planner digital completo',
        price: '29.90',
        isActive: true,
        isFeatured: true,
        seoTitle: 'Planner Digital 2024 - Organização Completa',
        seoDescription: 'Planner digital completo para 2024',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        files: [
            {
                id: 'f1',
                name: 'planner-2024-complete',
                originalName: 'planner-2024-complete.pdf',
                mimeType: 'application/pdf',
                size: 2048576,
                path: '/files/planner-2024-complete.pdf'
            }
        ]
    },
    {
        id: '2',
        name: 'Kit Adesivos Motivacionais',
        slug: 'kit-adesivos-motivacionais',
        description: 'Coleção de adesivos motivacionais para impressão',
        shortDescription: 'Adesivos motivacionais para imprimir',
        price: '15.50',
        isActive: true,
        isFeatured: false,
        seoTitle: 'Kit Adesivos Motivacionais - Download',
        seoDescription: 'Kit completo de adesivos motivacionais para impressão',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
        files: [
            {
                id: 'f2',
                name: 'adesivos-motivacionais',
                originalName: 'adesivos-motivacionais.pdf',
                mimeType: 'application/pdf',
                size: 1024768,
                path: '/files/adesivos-motivacionais.pdf'
            }
        ]
    },
    {
        id: '3',
        name: 'Agenda Semanal Minimalista',
        slug: 'agenda-semanal-minimalista',
        description: 'Agenda semanal com design clean e minimalista',
        shortDescription: 'Agenda semanal minimalista',
        price: '12.90',
        isActive: false,
        isFeatured: false,
        seoTitle: 'Agenda Semanal Minimalista - PDF',
        seoDescription: 'Agenda semanal com design minimalista para download',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-12'),
        files: []
    }
]

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

    // Sincronizar busca externa com estado interno
    useEffect(() => {
        setSearch(externalSearch)
    }, [externalSearch])

    useEffect(() => {
        // Buscar produtos reais da API
        async function fetchProducts() {
            try {
                const params = new URLSearchParams()
                if (externalSearch) params.append('search', externalSearch)
                if (category) params.append('category', category)
                if (page > 1) params.append('page', page.toString())

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
                // Fallback para dados mock em caso de erro
                setProducts(mockProducts)
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
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-') as [typeof sortBy, typeof sortOrder]
                    setSortBy(field)
                    setSortOrder(order)
                }}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                        <SelectItem value="price-asc">Preço (Menor)</SelectItem>
                        <SelectItem value="price-desc">Preço (Maior)</SelectItem>
                        <SelectItem value="created-desc">Mais recentes</SelectItem>
                        <SelectItem value="created-asc">Mais antigos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabela */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
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
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    {search || statusFilter !== 'all' ? 'Nenhum produto encontrado com os filtros aplicados.' : 'Nenhum produto cadastrado ainda.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-gray-50">
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
                                            <p className="text-sm font-medium">{product.files.length} arquivo(s)</p>
                                            {product.files.length > 0 && (
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