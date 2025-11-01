'use client'

import { useState, useEffect } from 'react'
import { Eye, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface Order {
    id: string
    email: string
    user: string
    status: string
    total: string
    itemsCount: number
    createdAt: string
    paymentProvider: string | null
}

interface OrderItem {
    productName: string
    variationName: string | null
    quantity: number
    total: string
}

interface OrderDetail {
    id: string
    email: string
    status: string
    total: string
    createdAt: string
    user: {
        name: string
    } | null
    items: OrderItem[]
}

interface OrdersTableProps {
    search: string
    statusFilter: string
    onRefresh: () => void
}

export default function OrdersTable({ search, statusFilter, onRefresh }: OrdersTableProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
    const [orderDetails, setOrderDetails] = useState<OrderDetail | null>(null)

    const loadOrders = async () => {
        try {
            setLoading(true)
            const url = statusFilter === 'all'
                ? '/api/admin/orders'
                : `/api/admin/orders?status=${statusFilter}`

            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setOrders(data.orders || [])
            }
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadOrderDetails = async (orderId: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`)
            if (response.ok) {
                const data = await response.json()
                setOrderDetails(data)
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error)
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                loadOrders()
                onRefresh()
                if (selectedOrder === orderId) {
                    loadOrderDetails(orderId)
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
        }
    }

    useEffect(() => {
        loadOrders()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter])

    useEffect(() => {
        if (selectedOrder) {
            loadOrderDetails(selectedOrder)
        }
    }, [selectedOrder])

    const filteredOrders = orders.filter(order => {
        const searchLower = search.toLowerCase()
        return (
            order.id.toLowerCase().includes(searchLower) ||
            order.email.toLowerCase().includes(searchLower) ||
            order.user.toLowerCase().includes(searchLower)
        )
    })

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
            pending: { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
            processing: { variant: 'default', color: 'bg-blue-100 text-blue-800' },
            completed: { variant: 'default', color: 'bg-green-100 text-green-800' },
            cancelled: { variant: 'destructive', color: 'bg-red-100 text-red-800' },
            refunded: { variant: 'secondary', color: 'bg-gray-100 text-gray-800' },
        }

        const config = variants[status] || variants.pending

        const labels: Record<string, string> = {
            pending: 'Pendente',
            processing: 'Processando',
            completed: 'Concluído',
            cancelled: 'Cancelado',
            refunded: 'Reembolsado',
        }

        return (
            <Badge className={config.color}>
                {labels[status] || status}
            </Badge>
        )
    }

    if (loading) {
        return <div className="text-center py-8">Carregando pedidos...</div>
    }

    if (filteredOrders.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">
                    {search ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Itens</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                        #{order.id.slice(0, 8)}
                                    </code>
                                </td>
                                <td className="py-3 px-4">
                                    <div>
                                        <div className="font-medium text-gray-900">{order.user}</div>
                                        <div className="text-xs text-gray-500">{order.email}</div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    {getStatusBadge(order.status)}
                                </td>
                                <td className="py-3 px-4 font-semibold text-[#FD9555]">
                                    R$ {parseFloat(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4">
                                    <Badge variant="outline">{order.itemsCount} {order.itemsCount === 1 ? 'item' : 'itens'}</Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => setSelectedOrder(order.id)}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Ver Detalhes
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'completed')}>
                                                Marcar como Concluído
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'cancelled')}>
                                                Cancelar Pedido
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dialog de Detalhes */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Pedido #{selectedOrder?.slice(0, 8)}</DialogTitle>
                        <DialogDescription>
                            Informações completas do pedido
                        </DialogDescription>
                    </DialogHeader>

                    {orderDetails && (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Cliente</label>
                                    <p className="text-gray-900">{orderDetails.user?.name || orderDetails.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Email</label>
                                    <p className="text-gray-900">{orderDetails.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Status</label>
                                    <div className="mt-1">
                                        <Select
                                            value={orderDetails.status}
                                            onValueChange={(value) => handleStatusChange(orderDetails.id, value)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pendente</SelectItem>
                                                <SelectItem value="processing">Processando</SelectItem>
                                                <SelectItem value="completed">Concluído</SelectItem>
                                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                                <SelectItem value="refunded">Reembolsado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700">Data</label>
                                    <p className="text-gray-900">{new Date(orderDetails.createdAt).toLocaleString('pt-BR')}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Itens do Pedido</h3>
                                <div className="border rounded-lg">
                                    {orderDetails.items?.map((item: OrderItem, idx: number) => (
                                        <div key={idx} className="p-4 border-b last:border-b-0 flex justify-between">
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                {item.variationName && (
                                                    <p className="text-sm text-gray-600">{item.variationName}</p>
                                                )}
                                                <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-[#FD9555]">
                                                    R$ {parseFloat(item.total).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold">Total</span>
                                    <span className="text-2xl font-bold text-[#FD9555]">
                                        R$ {parseFloat(orderDetails.total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
