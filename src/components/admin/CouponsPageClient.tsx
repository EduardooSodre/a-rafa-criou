'use client'

import { useState, useEffect } from 'react'
import {
    Ticket,
    Plus,
    Search,
    Calendar,
    Percent,
    DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import CouponForm from './CouponForm'
import CouponsTable from './CouponsTable'

interface CouponStats {
    total: number
    active: number
    inactive: number
    totalRedemptions: number
}

export default function CouponsPageClient() {
    const [search, setSearch] = useState('')
    const [isNewCouponOpen, setIsNewCouponOpen] = useState(false)
    const [stats, setStats] = useState<CouponStats>({ total: 0, active: 0, inactive: 0, totalRedemptions: 0 })
    const [loading, setLoading] = useState(true)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1)
        loadStats()
    }

    const loadStats = async () => {
        try {
            const response = await fetch('/api/admin/coupons')
            if (response.ok) {
                const data = await response.json()
                const coupons = data.coupons || []
                
                setStats({
                    total: coupons.length,
                    active: coupons.filter((c: { isActive: boolean }) => c.isActive).length,
                    inactive: coupons.filter((c: { isActive: boolean }) => !c.isActive).length,
                    totalRedemptions: coupons.reduce((acc: number, c: { usedCount: number }) => acc + (c.usedCount || 0), 0)
                })
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStats()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="border-l-4">
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-[#FED466] to-[#FD9555] rounded-xl shadow-sm">
                        <Ticket className="w-7 h-7 text-gray-800" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Cupons</h1>
                        <p className="text-gray-600 mt-1">Gerencie cupons de desconto da loja</p>
                    </div>
                </div>

                <Dialog open={isNewCouponOpen} onOpenChange={setIsNewCouponOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#FED466] hover:bg-[#FD9555] text-gray-800 font-medium shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Cupom
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Ticket className="w-5 h-5" />
                                Criar Novo Cupom
                            </DialogTitle>
                            <DialogDescription>
                                Preencha as informações para criar um cupom de desconto
                            </DialogDescription>
                        </DialogHeader>
                        <CouponForm onSuccess={() => {
                            setIsNewCouponOpen(false)
                            handleRefresh()
                        }} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total de Cupons</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Ticket className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Cupons Ativos</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <Percent className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Cupons Inativos</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <Calendar className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-[#FED466]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total de Usos</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalRedemptions}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Cupons */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="w-5 h-5" />
                                Lista de Cupons
                                <Badge variant="outline" className="ml-2">{stats.total}</Badge>
                            </CardTitle>
                            <CardDescription>
                                Gerencie todos os cupons de desconto
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Pesquisar cupons por código..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <CouponsTable 
                        key={refreshTrigger}
                        search={search}
                        onRefresh={handleRefresh}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
