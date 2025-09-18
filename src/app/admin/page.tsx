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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i}>
                            <CardHeader className="pb-3">
                                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
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
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProdutos}</div>
                        <p className="text-xs text-muted-foreground">
                            Produtos ativos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Clientes Cadastrados</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClientes.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Total de usuários
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Pedidos este Mês</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pedidosMes}</div>
                        <p className="text-xs text-muted-foreground">
                            Vendas realizadas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Arquivos no Sistema</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.arquivosUpload}</div>
                        <p className="text-xs text-muted-foreground">
                            PDFs disponíveis
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            R$ {stats.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Faturamento atual
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Downloads do Mês</CardTitle>
                        <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.downloadsMes}</div>
                        <p className="text-xs text-muted-foreground">
                            Produtos entregues
                        </p>
                    </CardContent>
                </Card>
            </div>



            {/* Recent Orders */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Pedidos Recentes</CardTitle>
                    <CardDescription>
                        Últimos pedidos realizados na plataforma
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recentOrders.map((order) => (
                            <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 sm:gap-0">
                                <div className="flex-1">
                                    <p className="font-medium">{order.customerName}</p>
                                    <p className="text-sm text-gray-600">Pedido #{order.id}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="font-medium">R$ {order.total.toFixed(2).replace('.', ',')}</p>
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
                    <div className="mt-4 text-center">
                        <Link href="/admin/pedidos">
                            <Button variant="outline">Ver Todos os Pedidos</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}