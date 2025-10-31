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
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '@/contexts/cart-context';

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
    updatedAt: string | null;
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

    // Estados para Pix
    const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
    const [generatingPix, setGeneratingPix] = useState(false);
    const [pixError, setPixError] = useState('');
    const [checkingPayment, setCheckingPayment] = useState(false);

    const { clearCart } = useCart();

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

            // Debug: verificar dados do pedido
            console.log('📦 Pedido carregado:', {
                id: data.id,
                status: data.status,
                paymentProvider: data.paymentProvider,
                paymentStatus: data.paymentStatus,
                isPixProvider: data.paymentProvider === 'mercado_pago' || data.paymentProvider === 'pix',
                shouldShowPix: data.status === 'pending' && (data.paymentProvider === 'mercado_pago' || data.paymentProvider === 'pix'),
                fullData: JSON.stringify(data, null, 2)
            });
        } catch (err) {
            console.error('Erro ao buscar pedido:', err);
            setError('Não foi possível carregar o pedido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    const generatePixForExistingOrder = async () => {
        if (!order) return;

        try {
            setGeneratingPix(true);
            setPixError('');

            const response = await fetch('/api/mercado-pago/regenerate-pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao gerar Pix');
            }

            setPixData(data);
        } catch (err) {
            console.error('Erro ao gerar Pix:', err);
            setPixError(err instanceof Error ? err.message : 'Erro ao gerar Pix');
        } finally {
            setGeneratingPix(false);
        }
    };

    const checkPaymentStatus = async () => {
        if (!order) return;

        try {
            setCheckingPayment(true);

            console.log('🔄 Verificando status do pagamento...', {
                orderId: order.id,
                currentStatus: order.status,
                paymentProvider: order.paymentProvider
            });

            const response = await fetch(`/api/orders/status?orderId=${order.id}`);
            const data = await response.json();

            console.log('✅ Resposta do servidor:', data);

            if (data.status === 'completed' || data.paymentStatus === 'paid') {
                console.log('🎉 Pagamento confirmado! Atualizando página...');
                // Atualizar o pedido localmente
                setOrder({ ...order, status: 'completed', paymentStatus: 'paid' });
                clearCart();
                // Recarregar a página para mostrar downloads
                window.location.reload();
            }
        } catch (err) {
            console.error('❌ Erro ao verificar pagamento:', err);
        } finally {
            setCheckingPayment(false);
        }
    };

    // Polling automático para pedidos pendentes com Pix
    useEffect(() => {
        if (!order || order.status !== 'pending') {
            return;
        }

        // Verificar se é Pix (aceita 'mercado_pago' ou 'pix')
        const isPixPayment = order.paymentProvider === 'mercado_pago' || order.paymentProvider === 'pix';

        if (!isPixPayment) {
            console.log('⏸️ Polling desativado - não é pagamento Pix', {
                paymentProvider: order.paymentProvider
            });
            return;
        }

        console.log('▶️ Iniciando polling automático a cada 4 segundos...', {
            orderId: order.id,
            paymentProvider: order.paymentProvider
        });

        const interval = setInterval(() => {
            checkPaymentStatus();
        }, 4000); // Verifica a cada 4 segundos

        return () => {
            console.log('⏹️ Parando polling automático');
            clearInterval(interval);
        };
    }, [order]); // eslint-disable-line react-hooks/exhaustive-deps

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

            // Abrir download usando a URL assinada
            // Usar createElement + click para melhor compatibilidade mobile
            const downloadUrl = data.downloadUrl || data.signedUrl;
            if (downloadUrl) {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.download = ''; // Força download no mobile
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
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
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
                <Link href="/conta/pedidos">
                    <Button variant="ghost" className="mb-3 sm:mb-4 -ml-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                </Link>

                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            Pedido #{order.id.slice(0, 8)}...
                        </h1>
                        {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm sm:text-base text-gray-600">
                        Realizado em {formatDate(order.createdAt)}
                    </p>
                </div>

                {/* ⚠️ Alerta de Cancelamento */}
                {order.status === 'cancelled' && (
                    <Alert variant="destructive" className="mb-4 sm:mb-6">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <AlertDescription className="text-xs sm:text-sm">
                            <strong>Pedido Cancelado</strong>
                            <p className="mt-2">
                                Este pedido foi cancelado {order.updatedAt ? `em ${formatDate(order.updatedAt)}` : ''}.
                            </p>
                            <p className="mt-2">
                                <strong>Possíveis motivos:</strong>
                            </p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Você cancelou o pedido antes de efetuar o pagamento</li>
                                <li>O pagamento não foi confirmado dentro do prazo</li>
                                <li>Houve um problema com o método de pagamento</li>
                            </ul>
                            <p className="mt-3">
                                Se você deseja adquirir estes produtos novamente, adicione-os ao carrinho e realize um novo pedido.
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                {/* ✅ Alerta de Sucesso (Pedido Completo) */}
                {order.status === 'completed' && (
                    <Alert className="mb-4 sm:mb-6 border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <AlertDescription className="text-green-800 text-xs sm:text-sm">
                            <strong>Pedido Concluído com Sucesso!</strong>
                            <p className="mt-1">
                                Seu pedido foi pago e você já pode fazer o download dos produtos abaixo.
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                {/* ⏳ Alerta de Pendência com Pix */}
                {order.status === 'pending' && (
                    <>
                        <Alert className="mb-4 sm:mb-6 border-yellow-200 bg-yellow-50">
                            <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                            <AlertDescription className="text-yellow-800">
                                <strong className="text-sm sm:text-base">Aguardando Pagamento</strong>
                                <p className="mt-1 text-xs sm:text-sm">
                                    Seu pedido foi criado, mas ainda está aguardando a confirmação do pagamento.
                                </p>
                                {(order.paymentProvider === 'mercado_pago' || order.paymentProvider === 'pix') && (
                                    <p className="mt-2 text-xs sm:text-sm font-semibold">
                                        {pixData ?
                                            '👇 Escaneie o QR Code abaixo para pagar' :
                                            '👇 Clique no botão abaixo para gerar o QR Code do Pix'
                                        }
                                    </p>
                                )}
                            </AlertDescription>
                        </Alert>

                        {/* Card do Pix - OTIMIZADO PARA MOBILE */}
                        {(order.paymentProvider === 'mercado_pago' || order.paymentProvider === 'pix') && (
                            <Card className="mb-4 sm:mb-6 shadow-lg border-2 border-[#FED466]">
                                <CardHeader className="pb-3 sm:pb-6">
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        🎯 Pagamento via Pix
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        {pixData ?
                                            'Escaneie o QR Code ou copie o código para pagar' :
                                            'Gere o QR Code do Pix para completar seu pagamento'
                                        }
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                                    {pixData ? (
                                        <div className="space-y-3 sm:space-y-4">
                                            {/* QR Code */}
                                            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-lg border-2 border-[#FED466] shadow-inner">
                                                <div className="w-full max-w-[256px]">
                                                    <QRCodeSVG
                                                        value={pixData.qrCode}
                                                        size={256}
                                                        level="M"
                                                        includeMargin={true}
                                                        className="w-full h-auto"
                                                    />
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 text-center font-medium">
                                                    📱 Escaneie este QR Code com o app do seu banco
                                                </p>
                                            </div>

                                            {/* Pix Copia e Cola */}
                                            <div>
                                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                                                    Ou copie o código Pix:
                                                </label>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <input
                                                        type="text"
                                                        value={pixData.qrCode}
                                                        readOnly
                                                        aria-label="Código Pix copia e cola"
                                                        className="flex-1 px-2 sm:px-3 py-2 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-mono bg-gray-50 overflow-x-auto"
                                                    />
                                                    <Button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(pixData.qrCode);
                                                            alert('✅ Código Pix copiado!');
                                                        }}
                                                        variant="outline"
                                                        className="w-full sm:w-auto whitespace-nowrap h-10 sm:h-auto"
                                                    >
                                                        📋 Copiar
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Botão de verificar pagamento */}
                                            <Button
                                                onClick={checkPaymentStatus}
                                                disabled={checkingPayment}
                                                size="lg"
                                                className="w-full h-12 sm:h-auto bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-md"
                                            >
                                                {checkingPayment ? (
                                                    <>
                                                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                                                        Verificando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                                        Já Paguei
                                                    </>
                                                )}
                                            </Button>

                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <p className="text-xs sm:text-sm text-green-800 text-center">
                                                    ✅ Verificando pagamento automaticamente a cada 4 segundos
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 sm:space-y-4">
                                            {pixError && (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription className="text-xs sm:text-sm">{pixError}</AlertDescription>
                                                </Alert>
                                            )}

                                            <Button
                                                onClick={generatePixForExistingOrder}
                                                disabled={generatingPix}
                                                size="lg"
                                                className="w-full h-14 bg-[#FED466] hover:bg-[#FED466]/90 text-black font-bold text-base sm:text-lg shadow-lg"
                                            >
                                                {generatingPix ? (
                                                    <>
                                                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                                                        Gerando QR Code...
                                                    </>
                                                ) : (
                                                    <>
                                                        🎯 Gerar QR Code do Pix
                                                    </>
                                                )}
                                            </Button>

                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs sm:text-sm text-blue-800 text-center">
                                                    💡 O QR Code será gerado instantaneamente e você poderá pagar via Pix
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* Informações do Pedido */}
                <Card className="mb-4 sm:mb-6">
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-base sm:text-lg">Informações do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">E-mail</p>
                                <p className="font-medium text-sm sm:text-base break-all">{order.email}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Forma de Pagamento</p>
                                <p className="font-medium text-sm sm:text-base capitalize">{order.paymentProvider === 'mercado_pago' ? 'Pix' : order.paymentProvider}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Status do Pagamento</p>
                                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                                    {order.paymentStatus === 'paid' ? 'Pago' : order.paymentStatus}
                                </Badge>
                            </div>
                            {order.paidAt && (
                                <div>
                                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Data do Pagamento</p>
                                    <p className="font-medium text-sm sm:text-base">{formatDate(order.paidAt)}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Produtos */}
                <Card className="mb-4 sm:mb-6">
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-base sm:text-lg">Produtos Comprados</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            {order.status === 'completed'
                                ? 'Clique para fazer download dos seus produtos'
                                : 'Os downloads estarão disponíveis após a confirmação do pagamento'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                        <div className="space-y-3 sm:space-y-4">
                            {order.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-2">
                                            <h3 className="font-semibold text-sm sm:text-lg leading-tight">{item.name}</h3>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                                Quantidade: {item.quantity}
                                            </p>
                                        </div>
                                        <p className="text-base sm:text-lg font-bold text-[#FD9555] whitespace-nowrap">
                                            {formatPrice(item.total)}
                                        </p>
                                    </div>

                                    {order.status === 'completed' && (
                                        <>
                                            {(() => {
                                                // Calcular se o download expirou (30 dias)
                                                const paidDate = order.paidAt ? new Date(order.paidAt) : new Date(order.createdAt);
                                                const now = new Date();
                                                const daysSincePurchase = Math.floor((now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24));
                                                const isExpired = daysSincePurchase > 30;

                                                return (
                                                    <>
                                                        <Button
                                                            onClick={() => handleDownload(item.id)}
                                                            disabled={downloadingItems.has(item.id) || isExpired}
                                                            size="lg"
                                                            className={`w-full h-12 ${isExpired ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FED466] hover:bg-[#FED466]/90'} text-black font-bold text-sm sm:text-base`}
                                                        >
                                                            {isExpired ? (
                                                                <>
                                                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                                                    Download Expirado (30 dias)
                                                                </>
                                                            ) : downloadingItems.has(item.id) ? (
                                                                <>
                                                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                                                                    Gerando link...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                                                    📥 Fazer Download
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
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Resumo do Pedido */}
                <Card className="mb-4 sm:mb-6">
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-base sm:text-lg">Resumo do Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm sm:text-base">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2">
                                <span>Total</span>
                                <span className="text-[#FD9555]">{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Aviso sobre downloads */}
                {order.status === 'completed' && (
                    <Alert className="border-[#FED466] bg-yellow-50">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <AlertDescription className="text-xs sm:text-sm">
                            <strong>Importante:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Os links de download são válidos por 15 minutos.</li>
                                <li>Você pode gerar novos links clicando no botão de download novamente.</li>
                                <li className="text-red-600 font-semibold">
                                    O acesso ao download expira após 30 dias da data da compra.
                                </li>
                            </ul>
                            {order.paidAt && (
                                <p className="mt-3 text-xs sm:text-sm text-gray-700">
                                    Compra realizada em: <strong>{formatDate(order.paidAt)}</strong>
                                    <br />
                                    {(() => {
                                        const paidDate = new Date(order.paidAt);
                                        const expirationDate = new Date(paidDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                                        const now = new Date();
                                        const daysRemaining = Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

                                        if (daysRemaining === 0) {
                                            return (
                                                <span className="text-red-600 font-semibold text-xs sm:text-sm">
                                                    ⚠️ Download expirado
                                                </span>
                                            );
                                        } else if (daysRemaining <= 7) {
                                            return (
                                                <span className="text-orange-600 font-semibold text-xs sm:text-sm">
                                                    ⚠️ Expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span className="text-green-600 text-xs sm:text-sm">
                                                    ✅ Válido por mais {daysRemaining} dias
                                                </span>
                                            );
                                        }
                                    })()}
                                </p>
                            )}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}
