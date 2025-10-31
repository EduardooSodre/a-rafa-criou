'use client'

import { useState, useEffect } from 'react'
import { Package, Users, ShoppingCart, FileText, TrendingUp, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DashboardStats {
    totalProdutos: number
    totalClientes: number
    pedidosMes: number
    arquivosUpload: number
    receitaMes: number
    downloadsMes: number
    recentOrders: Array<{
        id: number
        customerName: string
        total: number
        status: 'completed' | 'pending' | 'cancelled'
        createdAt: string
    }>
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/admin/stats')
                if (!response.ok) {
                    throw new Error('Erro ao buscar estatísticas')
                }
                const data = await response.json()
                setStats(data)
                setLoading(false)
            } catch (error) {
                console.error('Erro ao buscar estatísticas:', error)
                // Fallback para dados mock
                setStats({
                    totalProdutos: 0,
                    totalClientes: 0,
                    pedidosMes: 0,
                    arquivosUpload: 0,
                    receitaMes: 0,
                    downloadsMes: 0,
                    recentOrders: []
                })
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="border-l-4">
                            <CardContent className="p-6">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (!stats) {
        return <div>Erro ao carregar dados</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#FED466] to-[#FD9555] rounded-xl shadow-sm">
                    <Package className="w-7 h-7 text-gray-800" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Visão geral da sua loja</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalProdutos}</p>
                                <p className="text-xs text-gray-500 mt-1">Produtos ativos</p>
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
                                <p className="text-sm font-medium text-gray-600">Clientes Cadastrados</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalClientes.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-1">Total de usuários</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pedidos este Mês</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.pedidosMes}</p>
                                <p className="text-xs text-gray-500 mt-1">Vendas realizadas</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <ShoppingCart className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Arquivos no Sistema</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.arquivosUpload}</p>
                                <p className="text-xs text-gray-500 mt-1">PDFs disponíveis</p>
                            </div>
                            <div className="p-3 bg-indigo-100 rounded-full">
                                <FileText className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-[#FD9555]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Receita do Mês</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    R$ {stats.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Faturamento atual</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                                <TrendingUp className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-teal-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Downloads do Mês</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.downloadsMes}</p>
                                <p className="text-xs text-gray-500 mt-1">Produtos entregues</p>
                            </div>
                            <div className="p-3 bg-teal-100 rounded-full">
                                <Download className="w-6 h-6 text-teal-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5" />
                                Pedidos Recentes
                            </CardTitle>
                            <CardDescription>
                                Últimos pedidos realizados na plataforma
                            </CardDescription>
                        </div>
                        <Link href="/admin/pedidos">
                            <Button variant="outline" size="sm">Ver Todos</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {stats.recentOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <ShoppingCart className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                            <p className="text-gray-600">Os pedidos mais recentes aparecerão aqui</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentOrders.map((order) => (
                                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 sm:gap-0 hover:border-[#FED466] transition-colors">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{order.customerName}</p>
                                        <p className="text-sm text-gray-600">Pedido #{order.id}</p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="font-medium text-gray-900">
                                            R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(order.total ?? 0))}
                                        </p>
                                        <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {order.status === 'completed' ? 'Concluído' :
                                                order.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}