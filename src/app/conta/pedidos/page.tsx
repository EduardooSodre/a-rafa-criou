'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, XCircle, Package } from 'lucide-react';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    items: OrderItem[];
    itemCount: number;
}

export default function PedidosPage() {
    const { status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('todos');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login?callbackUrl=/conta/pedidos');
            return;
        }

        if (status === 'authenticated') {
            fetchOrders();
        }
    }, [status, router]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch('/api/orders/my-orders', {
                cache: 'no-store' // Força buscar dados atualizados
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar pedidos');
            }

            const data = await response.json();
            console.log('📦 Pedidos recebidos:', data.orders?.length || 0);
            console.log('📋 Status dos pedidos:', data.orders?.map((o: Order) => `${o.id.slice(0, 8)} - ${o.status}`));
            setOrders(data.orders || []);
            setLastUpdate(new Date());
        } catch (err) {
            console.error('❌ Erro ao buscar pedidos:', err);
            setError('Não foi possível carregar seus pedidos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, {
            label: string;
            variant: 'default' | 'secondary' | 'destructive' | 'outline';
            icon: React.ReactNode;
            bgColor: string;
        }> = {
            completed: {
                label: 'Concluído',
                variant: 'default',
                icon: <CheckCircle className="w-4 h-4 mr-1" />,
                bgColor: 'bg-green-50 border-green-200 text-green-800'
            },
            pending: {
                label: 'Pendente',
                variant: 'secondary',
                icon: <Clock className="w-4 h-4 mr-1" />,
                bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-800'
            },
            cancelled: {
                label: 'Cancelado',
                variant: 'destructive',
                icon: <XCircle className="w-4 h-4 mr-1" />,
                bgColor: 'bg-red-50 border-red-200 text-red-800'
            },
            processing: {
                label: 'Processando',
                variant: 'outline',
                icon: <Package className="w-4 h-4 mr-1" />,
                bgColor: 'bg-blue-50 border-blue-200 text-blue-800'
            },
            refunded: {
                label: 'Reembolsado',
                variant: 'outline',
                icon: <XCircle className="w-4 h-4 mr-1" />,
                bgColor: 'bg-gray-50 border-gray-200 text-gray-800'
            },
        };

        const statusInfo = statusMap[status] || {
            label: status,
            variant: 'outline' as const,
            icon: <Package className="w-4 h-4 mr-1" />,
            bgColor: 'bg-gray-50 border-gray-200 text-gray-800'
        };

        return (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${statusInfo.bgColor} font-semibold text-sm`}>
                {statusInfo.icon}
                {statusInfo.label}
            </div>
        );
    };

    const filterOrders = (filterStatus: string) => {
        if (filterStatus === 'todos') return orders;
        return orders.filter(order => order.status === filterStatus);
    };

    const getOrderCount = (filterStatus: string) => {
        if (filterStatus === 'todos') return orders.length;
        return orders.filter(order => order.status === filterStatus).length;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    if (status === 'loading' || loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-6">Meus Pedidos</h1>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-800">Erro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-700">{error}</p>
                        <Button onClick={fetchOrders} className="mt-4" variant="outline">
                            Tentar Novamente
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
                    <p className="text-gray-600">
                        Gerencie seus pedidos e faça download dos seus produtos
                    </p>
                    {lastUpdate && (
                        <p className="text-xs text-gray-400 mt-1">
                            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                        </p>
                    )}
                </div>
                <Button
                    onClick={fetchOrders}
                    variant="outline"
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <Package className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Atualizando...' : 'Atualizar'}
                </Button>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Nenhum pedido encontrado</CardTitle>
                        <CardDescription>
                            Você ainda não realizou nenhuma compra.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/produtos">
                            <Button className="bg-[#FED466] text-black hover:bg-[#FED466]/90">
                                Explorar Produtos
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-6 overflow-x-auto no-scrollbar -mx-4 px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="inline-flex space-x-2">
                            <TabsTrigger value="todos" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
                                <Package className="w-4 h-4" />
                                Todos
                                <Badge variant="secondary" className="ml-1">{getOrderCount('todos')}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
                                <CheckCircle className="w-4 h-4" />
                                Concluídos
                                <Badge variant="secondary" className="ml-1">{getOrderCount('completed')}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
                                <Clock className="w-4 h-4" />
                                Pendentes
                                <Badge variant="secondary" className="ml-1">{getOrderCount('pending')}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="processing" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
                                <Package className="w-4 h-4" />
                                Processando
                                <Badge variant="secondary" className="ml-1">{getOrderCount('processing')}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="cancelled" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm">
                                <XCircle className="w-4 h-4" />
                                Cancelados
                                <Badge variant="secondary" className="ml-1">{getOrderCount('cancelled')}</Badge>
                            </TabsTrigger>
                        </div>
                    </TabsList>

                    <TabsContent value="todos" className="space-y-4">
                        {filterOrders('todos').map((order) => (
                            <OrderCard key={order.id} order={order} getStatusBadge={getStatusBadge} formatDate={formatDate} formatPrice={formatPrice} />
                        ))}
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-4">
                        {filterOrders('completed').length > 0 ? (
                            filterOrders('completed').map((order) => (
                                <OrderCard key={order.id} order={order} getStatusBadge={getStatusBadge} formatDate={formatDate} formatPrice={formatPrice} />
                            ))
                        ) : (
                            <Card>
                                <CardContent className="py-8 text-center text-gray-500">
                                    Nenhum pedido concluído encontrado
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-4">
                        {filterOrders('pending').length > 0 ? (
                            filterOrders('pending').map((order) => (
                                <OrderCard key={order.id} order={order} getStatusBadge={getStatusBadge} formatDate={formatDate} formatPrice={formatPrice} />
                            ))
                        ) : (
                            <Card>
                                <CardContent className="py-8 text-center text-gray-500">
                                    Nenhum pedido pendente encontrado
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="processing" className="space-y-4">
                        {filterOrders('processing').length > 0 ? (
                            filterOrders('processing').map((order) => (
                                <OrderCard key={order.id} order={order} getStatusBadge={getStatusBadge} formatDate={formatDate} formatPrice={formatPrice} />
                            ))
                        ) : (
                            <Card>
                                <CardContent className="py-8 text-center text-gray-500">
                                    Nenhum pedido em processamento encontrado
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="cancelled" className="space-y-4">
                        {filterOrders('cancelled').length > 0 ? (
                            filterOrders('cancelled').map((order) => (
                                <OrderCard key={order.id} order={order} getStatusBadge={getStatusBadge} formatDate={formatDate} formatPrice={formatPrice} />
                            ))
                        ) : (
                            <Card>
                                <CardContent className="py-8 text-center text-gray-500">
                                    Nenhum pedido cancelado encontrado
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

// Componente para renderizar cada card de pedido
function OrderCard({
    order,
    getStatusBadge,
    formatDate,
    formatPrice
}: {
    order: Order;
    getStatusBadge: (status: string) => React.ReactNode;
    formatDate: (date: string) => string;
    formatPrice: (price: number) => string;
}) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                        <CardTitle className="text-lg">
                            Pedido #{order.id.slice(0, 13)}...
                        </CardTitle>
                        <CardDescription>
                            {formatDate(order.createdAt)}
                        </CardDescription>
                    </div>
                    <div className="flex items-start justify-end">
                        {getStatusBadge(order.status)}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                            {order.itemCount} {order.itemCount === 1 ? 'item' : 'itens'}
                        </span>
                        <span className="text-lg font-bold text-[#FD9555]">
                            {formatPrice(order.total)}
                        </span>
                    </div>

                    {order.items.length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-sm font-semibold mb-2">Produtos:</p>
                            <ul className="space-y-1">
                                {order.items.slice(0, 3).map((item) => (
                                    <li key={item.id} className="text-sm text-gray-600">
                                        • {item.name} {item.quantity > 1 && `(${item.quantity}x)`}
                                    </li>
                                ))}
                                {order.items.length > 3 && (
                                    <li className="text-sm text-gray-500 italic">
                                        + {order.items.length - 3} {order.items.length - 3 === 1 ? 'outro item' : 'outros itens'}
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Mensagem especial para pedidos pendentes */}
                    {order.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                ⏳ <strong>Aguardando pagamento.</strong> Este pedido será processado assim que o pagamento for confirmado.
                            </p>
                        </div>
                    )}

                    {/* Mensagem para pedidos cancelados */}
                    {order.status === 'cancelled' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">
                                ❌ Este pedido foi cancelado e não poderá ser processado.
                            </p>
                        </div>
                    )}

                    {/* Botões de ação baseados no status */}
                    {order.status === 'pending' ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Link href={`/checkout/pix?orderId=${order.id}`} className="w-full sm:flex-1">
                                <Button
                                    className="w-full bg-[#FED466] hover:bg-[#FED466]/90 text-gray-800 font-semibold"
                                >
                                    💳 Pagar Agora
                                </Button>
                            </Link>
                            <Link href={`/conta/pedidos/${order.id}`} className="w-full sm:flex-1">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                >
                                    Ver Detalhes
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Link href={`/conta/pedidos/${order.id}`}>
                            <Button
                                className="w-full bg-[#FD9555] hover:bg-[#FD9555]/90 text-white"
                                disabled={order.status === 'cancelled'}
                            >
                                {order.status === 'completed' ? 'Ver Detalhes e Downloads' : 'Ver Detalhes'}
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}