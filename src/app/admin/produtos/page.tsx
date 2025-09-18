'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Plus,
    Search,
    Filter,
    Package,
    ShoppingBag,
    DollarSign,
    Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import ProductsTable from '@/components/admin/ProductsTable'
import ProductForm from '@/components/admin/ProductForm'

interface ProductStats {
    total: number
    active: number
    inactive: number
    revenue: number
}

export default function ProductsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [category, setCategory] = useState(searchParams.get('category') || 'all')
    const [isNewProductOpen, setIsNewProductOpen] = useState(false)
    const [stats, setStats] = useState<ProductStats>({ total: 0, active: 0, inactive: 0, revenue: 0 })
    const [loading, setLoading] = useState(true)

    // Carregar estatísticas
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/products/stats')
                if (response.ok) {
                    const data = await response.json()
                    setStats(data)
                }
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    // Auto-aplicar filtros quando mudarem
    useEffect(() => {
        const params = new URLSearchParams()

        if (search) params.set('search', search)
        if (category && category !== 'all') params.set('category', category)

        const queryString = params.toString()
        const newURL = queryString ? `/admin/produtos?${queryString}` : '/admin/produtos'

        router.push(newURL, { scroll: false })
    }, [search, category, router])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-16 mb-2" />
                                <Skeleton className="h-8 w-12" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-[#FED466] to-[#FD9555] rounded-xl shadow-sm">
                        <Package className="w-7 h-7 text-gray-800" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
                        <p className="text-gray-600 mt-1">Gerencie todo o catálogo da sua loja</p>
                    </div>
                </div>

                <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#FED466] hover:bg-[#FD9555] text-gray-800 font-medium shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Produto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Criar Novo Produto
                            </DialogTitle>
                            <DialogDescription>
                                Preencha as informações abaixo para adicionar um novo produto ao catálogo
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6">
                            <ProductForm onSuccess={() => {
                                setIsNewProductOpen(false)
                                // Recarregar estatísticas
                                fetch('/api/admin/products/stats').then(res => res.json()).then(setStats)
                            }} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <ShoppingBag className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Produtos Inativos</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-[#FED466]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    R$ {stats.total > 0 ? (stats.revenue / stats.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Produtos */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Catálogo de Produtos
                                <Badge variant="outline" className="ml-2">{stats.total}</Badge>
                            </CardTitle>
                            <CardDescription>
                                Visualize e gerencie todos os produtos da sua loja
                            </CardDescription>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Pesquisar produtos por nome, descrição..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full sm:w-48">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filtrar categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Categorias</SelectItem>
                                <SelectItem value="planner">📋 Planners</SelectItem>
                                <SelectItem value="adesivos">🏷️ Adesivos</SelectItem>
                                <SelectItem value="etiquetas">🏪 Etiquetas</SelectItem>
                                <SelectItem value="agenda">📅 Agendas</SelectItem>
                                <SelectItem value="organizacao">📦 Organização</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <ProductsTable
                        search={search}
                        category={category === 'all' ? '' : category}
                    />
                </CardContent>
            </Card>
        </div>
    )
}