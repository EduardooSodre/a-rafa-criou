'use client';

/**
 * Página de Checkout PIX (Stripe)
 * 
 * Exibe instruções para pagamento PIX via Stripe
 * NOTA: PIX só funciona em produção com conta Stripe brasileira ativada
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, QrCode } from 'lucide-react';

interface PixData {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
}

export default function CheckoutPixPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [pixData, setPixData] = useState<PixData | null>(null);
    const [loading, setLoading] = useState(true);
    const [paid, setPaid] = useState(false);
    const [error, setError] = useState<string>('');
    const [hasCreatedPayment, setHasCreatedPayment] = useState(false);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false); // 🔒 Flag para evitar chamadas simultâneas
    const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

    // 🔒 PROTEÇÃO EXTRA: useRef para garantir apenas 1 execução
    const hasInitialized = useRef(false);

    // Dados do cliente
    const email = searchParams.get('email') || '';
    const name = searchParams.get('name') || '';
    const orderId = searchParams.get('orderId') || ''; // 🔒 ID do pedido pendente (opcional)

    // Criar Payment Intent PIX OU retomar pagamento pendente
    const createPixPayment = useCallback(async () => {
        // 🔒 PROTEÇÃO: Evitar múltiplas chamadas simultâneas
        if (hasCreatedPayment || isCreatingPayment) {
            console.log('⚠️ Criação já em andamento, ignorando...');
            return;
        }

        try {
            setLoading(true);
            setHasCreatedPayment(true);
            setIsCreatingPayment(true); // 🔒 Marcar como em criação

            // 🔒 Se orderId existir, retomar pagamento pendente
            if (orderId) {
                console.log(`🔄 Retomando pagamento do pedido: ${orderId}`);
                console.log(`📧 Email/Name não obrigatórios no resume (vêm do pedido)`);

                const response = await fetch(`/api/stripe/resume-payment?orderId=${orderId}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('❌ Erro ao retomar pagamento:', errorData);
                    throw new Error(errorData.error || 'Erro ao retomar pagamento');
                }

                const data: PixData = await response.json();
                console.log('✅ Payment Intent retomado com sucesso:', {
                    paymentIntentId: data.paymentIntentId,
                    amount: data.amount,
                });

                setPixData(data);
                setLoading(false);
                setIsCreatingPayment(false);
                startPolling(data.paymentIntentId);
                return; // ⚠️ IMPORTANTE: Retornar aqui para não criar novo pedido
            }

            // ✅ Caso contrário, criar novo pagamento do carrinho
            const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

            if (cartItems.length === 0) {
                console.log('⚠️ Carrinho vazio, redirecionando...');
                router.push('/carrinho');
                return;
            }

            console.log(`🆕 Criando novo pedido PIX com ${cartItems.length} itens`);
            console.log(`📧 Email: ${email}, Name: ${name}`);

            const response = await fetch('/api/stripe/create-pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems,
                    email,
                    name,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao criar pagamento PIX');
            }

            const data: PixData = await response.json();
            setPixData(data);

            setLoading(false);
            setIsCreatingPayment(false);

            // Iniciar polling de status
            startPolling(data.paymentIntentId);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar QR Code PIX. Tente novamente.';
            setError(errorMessage);
            setLoading(false);
            setIsCreatingPayment(false);
            setHasCreatedPayment(false); // Permitir tentar novamente em caso de erro
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, name, router, hasCreatedPayment, isCreatingPayment, orderId]);

    useEffect(() => {
        // 🔒 PROTEÇÃO: Evitar execução dupla (principalmente em desenvolvimento)
        if (hasInitialized.current) {
            console.log('⚠️ useEffect já foi executado, ignorando...');
            return;
        }

        // ✅ Se orderId existe (retomando pagamento), não precisa de email/name
        // ✅ Se orderId NÃO existe (novo pagamento), precisa de email/name
        if (!orderId && (!email || !name)) {
            console.log('⚠️ Novo pagamento sem email/name, redirecionando para carrinho...');
            router.push('/carrinho');
            return;
        }

        // 🔒 PROTEÇÃO: Só criar pagamento se ainda não foi criado e não está criando
        if (!hasCreatedPayment && !isCreatingPayment) {
            hasInitialized.current = true; // ✅ Marcar como inicializado
            console.log('🚀 Iniciando criação de pagamento PIX...');
            createPixPayment();
        }

        // Cleanup: parar polling quando componente desmontar
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, name, orderId]); // ✅ Adicionado orderId nas dependências

    // Iniciar polling
    const startPolling = (paymentIntentId: string) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/stripe/payment-status?id=${paymentIntentId}`);
                const data = await response.json();

                if (data.status === 'succeeded') {
                    clearInterval(interval);
                    setPollingInterval(null);
                    setPaid(true);

                    // Limpar carrinho
                    localStorage.removeItem('cart');

                    // Redirecionar com payment_intent na URL (igual ao cartão)
                    setTimeout(() => {
                        router.push(`/obrigado?payment_intent=${paymentIntentId}&payment_intent_client_secret=${pixData?.clientSecret}`);
                    }, 1000);
                }

            } catch {
                // Silencioso em produção
            }
        }, 3000); // Verificar a cada 3 segundos

        setPollingInterval(interval);

        // Timeout após 5 minutos
        setTimeout(() => {
            clearInterval(interval);
            setPollingInterval(null);
        }, 5 * 60 * 1000);
    };

    // Simular pagamento PIX (apenas desenvolvimento)
    const simulatePayment = async () => {
        if (!pixData?.paymentIntentId) return;

        try {
            const response = await fetch('/api/stripe/simulate-pix-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentIntentId: pixData.paymentIntentId }),
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Pagamento simulado! Aguarde o webhook processar...');
            } else {
                alert(`❌ Erro: ${data.error || 'Erro desconhecido'}`);
            }
        } catch {
            alert('❌ Erro ao simular pagamento');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Loader2 className="w-12 h-12 animate-spin text-[#FED466]" />
                <p className="mt-4 text-gray-600">Gerando QR Code PIX...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container max-w-md mx-auto py-12 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Erro</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/carrinho')} className="w-full">
                            Voltar ao Carrinho
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (paid) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
                <p className="text-gray-600">Redirecionando...</p>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-12 px-4">
            <Card>
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <QrCode className="w-12 h-12 text-[#FED466]" />
                    </div>
                    <CardTitle className="text-2xl">Pagamento PIX em Processamento</CardTitle>
                    <CardDescription>
                        Seu pagamento foi iniciado e está aguardando confirmação
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Valor */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Valor a pagar</p>
                        <p className="text-3xl font-bold text-[#FD9555]">
                            R$ {pixData?.amount.toFixed(2)}
                        </p>
                    </div>

                    {/* Aviso sobre PIX */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                            <QrCode className="w-5 h-5" />
                            Pagamento PIX - Stripe
                        </h3>
                        <p className="text-sm text-orange-800">
                            O pagamento via PIX está sendo processado pela Stripe.
                            Você receberá as instruções de pagamento por e-mail em instantes.
                        </p>
                    </div>

                    {/* Instruções */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Próximos passos:</h3>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>Verifique seu e-mail <strong>{email}</strong></li>
                            <li>Você receberá as instruções de pagamento PIX da Stripe</li>
                            <li>Escaneie o QR Code ou copie o código PIX</li>
                            <li>Realize o pagamento no app do seu banco</li>
                            <li>Após confirmação, você será redirecionado automaticamente</li>
                        </ol>
                    </div>

                    {/* Status */}
                    <div className="text-center text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                        Aguardando confirmação do pagamento...
                    </div>

                    {/* Informação sobre Payment Intent */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-600 text-center">
                            ID do Pagamento: <code className="bg-gray-200 px-2 py-1 rounded">{pixData?.paymentIntentId}</code>
                        </p>
                    </div>

                    {/* Botão de Teste - APENAS DESENVOLVIMENTO */}
                    {process.env.NODE_ENV !== 'production' && (
                        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                            <h3 className="font-semibold text-yellow-900 mb-2">🧪 Modo de Desenvolvimento</h3>
                            <p className="text-sm text-yellow-800 mb-3">
                                PIX não funciona em modo de teste. Use o botão abaixo para simular
                                o pagamento do <strong>Payment Intent específico</strong> que você criou:
                            </p>
                            <Button
                                onClick={simulatePayment}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
                            >
                                ⚡ Simular Pagamento PIX (Teste)
                            </Button>
                            <p className="text-xs text-yellow-700 mt-2 text-center">
                                Isso confirmará o Payment Intent real com os produtos e valores corretos
                            </p>
                        </div>
                    )}

                    {/* Botão Cancelar */}
                    <Button
                        onClick={() => router.push('/carrinho')}
                        variant="outline"
                        className="w-full"
                    >
                        Cancelar e voltar ao carrinho
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
