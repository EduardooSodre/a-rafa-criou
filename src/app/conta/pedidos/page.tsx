'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
      const response = await fetch('/api/orders/my-orders');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar pedidos');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Não foi possível carregar seus pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      completed: { label: 'Concluído', variant: 'default' },
      pending: { label: 'Pendente', variant: 'secondary' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      processing: { label: 'Processando', variant: 'outline' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
        <p className="text-gray-600">
          Gerencie seus pedidos e faça download dos seus produtos
        </p>
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
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Pedido #{order.id.slice(0, 13)}...
                    </CardTitle>
                    <CardDescription>
                      {formatDate(order.createdAt)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(order.status)}
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

                  <Link href={`/conta/pedidos/${order.id}`}>
                    <Button 
                      className="w-full bg-[#FD9555] hover:bg-[#FD9555]/90 text-white"
                    >
                      Ver Detalhes e Downloads
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
