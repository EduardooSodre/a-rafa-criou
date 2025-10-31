'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, ArrowLeft, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface OrderItem {
    id: string;
    productId: string;
    variationId: string | null;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

interface OrderDetails {
    id: string;
    email: string;
    status: string;
    subtotal: number;
    total: number;
    paymentProvider: string;
    paymentStatus: string;
    createdAt: string;
    paidAt: string | null;
    updatedAt: string | null; // ✅ Data de atualização
    items: OrderItem[];
}

export default function PedidoDetalhesPage() {
    const { status: sessionStatus } = useSession();
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());
    const [downloadMessages, setDownloadMessages] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});

    const fetchOrderDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(`/api/orders/${orderId}`);

            if (response.status === 404) {
                setError('Pedido não encontrado');
                return;
            }

            if (response.status === 403) {
                setError('Você não tem permissão para acessar este pedido');
                return;
            }

            if (!response.ok) {
                throw new Error('Erro ao carregar pedido');
            }

            const data = await response.json();
            setOrder(data);
        } catch (err) {
            console.error('Erro ao buscar pedido:', err);
            setError('Não foi possível carregar o pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.push(`/auth/login?callbackUrl=/conta/pedidos/${orderId}`);
            return;
        }

        if (sessionStatus === 'authenticated') {
            fetchOrderDetails();
        }
    }, [sessionStatus, router, orderId, fetchOrderDetails]);

    const handleDownload = async (orderItemId: string) => {
        if (!order) return; // Guard clause
        
        try {
            // Adicionar ao set de downloads em andamento
            setDownloadingItems((prev) => new Set(prev).add(orderItemId));

            // Limpar mensagem anterior
            setDownloadMessages((prev) => {
                const newMessages = { ...prev };
                delete newMessages[orderItemId];
                return newMessages;
            });

            // ✅ USAR MESMO ENDPOINT QUE /obrigado (sem verificação de userId)
            const params = new URLSearchParams();
            params.set('orderId', order.id);
            params.set('itemId', orderItemId);

            const response = await fetch(`/api/orders/download?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao gerar link de download');
            }

            // Mostrar mensagem de sucesso
            setDownloadMessages((prev) => ({
                ...prev,
                [orderItemId]: {
                    type: 'success',
                    message: 'Link gerado com sucesso! Download iniciado.',
                },
            }));

            // Abrir download em nova aba usando a URL assinada
            const downloadUrl = data.downloadUrl || data.signedUrl;
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
            } else {
                throw new Error('URL de download não disponível');
            }

            // Limpar mensagem após 10 segundos
            setTimeout(() => {
                setDownloadMessages((prev) => {
                    const newMessages = { ...prev };
                    delete newMessages[orderItemId];
                    return newMessages;
                });
            }, 10000);
        } catch (err: unknown) {
            console.error('Erro ao fazer download:', err);

            const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar link de download';

            setDownloadMessages((prev) => ({
                ...prev,
                [orderItemId]: {
                    type: 'error',
                    message: errorMessage,
                },
            }));

            // Limpar mensagem de erro após 10 segundos
            setTimeout(() => {
                setDownloadMessages((prev) => {
                    const newMessages = { ...prev };
                    delete newMessages[orderItemId];
                    return newMessages;
                });
            }, 10000);
        } finally {
            // Remover do set de downloads em andamento
            setDownloadingItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(orderItemId);
                return newSet;
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
            completed: {
                label: 'Concluído',
                variant: 'default',
                icon: <CheckCircle2 className="w-4 h-4" />
            },
            pending: {
                label: 'Pendente',
                variant: 'secondary',
                icon: <Clock className="w-4 h-4" />
            },
            cancelled: {
                label: 'Cancelado',
                variant: 'destructive',
                icon: <AlertCircle className="w-4 h-4" />
            },
            processing: {
                label: 'Processando',
                variant: 'outline',
                icon: <Clock className="w-4 h-4" />
            },
        };

        const statusInfo = statusMap[status] || {
            label: status,
            variant: 'outline' as const,
            icon: <AlertCircle className="w-4 h-4" />
        };

        return (
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                {statusInfo.icon}
                {statusInfo.label}
            </Badge>
        );
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';

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

    if (sessionStatus === 'loading' || loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Skeleton className="h-8 w-48 mb-6" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link href="/conta/pedidos">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para Pedidos
                    </Button>
                </Link>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link href="/conta/pedidos">
                <Button variant="ghost" className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Pedidos
                </Button>
            </Link>

            <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-3xl font-bold">
                        Pedido #{order.id.slice(0, 13)}...
                    </h1>
                    {getStatusBadge(order.status)}
                </div>
                <p className="text-gray-600">
                    Realizado em {formatDate(order.createdAt)}
                </p>
            </div>

            {/* ⚠️ Alerta de Cancelamento */}
            {order.status === 'cancelled' && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Pedido Cancelado</strong>
                        <p className="mt-2">
                            Este pedido foi cancelado {order.updatedAt ? `em ${formatDate(order.updatedAt)}` : ''}.
                        </p>
                        <p className="mt-2 text-sm">
                            <strong>Possíveis motivos:</strong>
                        </p>
                        <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                            <li>Você cancelou o pedido antes de efetuar o pagamento</li>
                            <li>O pagamento não foi confirmado dentro do prazo</li>
                            <li>Houve um problema com o método de pagamento</li>
                        </ul>
                        <p className="mt-3 text-sm">
                            Se você deseja adquirir estes produtos novamente, adicione-os ao carrinho e realize um novo pedido.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {/* ✅ Alerta de Sucesso (Pedido Completo) */}
            {order.status === 'completed' && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        <strong>Pedido Concluído com Sucesso!</strong>
                        <p className="mt-1">
                            Seu pedido foi pago e você já pode fazer o download dos produtos abaixo.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {/* ⏳ Alerta de Pendência */}
            {order.status === 'pending' && (
                <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                        <strong>Aguardando Pagamento</strong>
                        <p className="mt-1">
                            Seu pedido foi criado, mas ainda está aguardando a confirmação do pagamento.
                        </p>
                        {order.paymentProvider === 'stripe' && (
                            <p className="mt-2 text-sm">
                                Se você já realizou o pagamento via PIX, aguarde alguns instantes para a confirmação automática.
                            </p>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Informações do Pedido */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Informações do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">E-mail</p>
                            <p className="font-medium">{order.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Forma de Pagamento</p>
                            <p className="font-medium capitalize">{order.paymentProvider}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Status do Pagamento</p>
                            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                {order.paymentStatus === 'paid' ? 'Pago' : order.paymentStatus}
                            </Badge>
                        </div>
                        {order.paidAt && (
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Data do Pagamento</p>
                                <p className="font-medium">{formatDate(order.paidAt)}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Produtos */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Produtos Comprados</CardTitle>
                    <CardDescription>
                        {order.status === 'completed'
                            ? 'Clique para fazer download dos seus produtos'
                            : 'Os downloads estarão disponíveis após a confirmação do pagamento'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            Quantidade: {item.quantity}
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-[#FD9555]">
                                        {formatPrice(item.total)}
                                    </p>
                                </div>

                                {order.status === 'completed' && (
                                    <>
                                        <Button
                                            onClick={() => handleDownload(item.id)}
                                            disabled={downloadingItems.has(item.id)}
                                            className="w-full bg-[#FED466] text-black hover:bg-[#FED466]/90"
                                        >
                                            {downloadingItems.has(item.id) ? (
                                                <>
                                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                    Gerando link...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Fazer Download
                                                </>
                                            )}
                                        </Button>

                                        {downloadMessages[item.id] && (
                                            <Alert
                                                variant={downloadMessages[item.id].type === 'error' ? 'destructive' : 'default'}
                                                className="mt-2"
                                            >
                                                <AlertDescription>
                                                    {downloadMessages[item.id].message}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Resumo do Pedido */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total</span>
                            <span className="text-[#FD9555]">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Aviso sobre downloads */}
            {order.status === 'completed' && (
                <Alert className="mt-6 border-[#FED466] bg-yellow-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Importante:</strong> Os links de download são válidos por 15 minutos.
                        Você pode gerar novos links clicando no botão de download novamente.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
