
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import ShadcnSpinner from './ShadcnSpinner';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PixResponse {
    qr_code: string;
    qr_code_base64: string;
    payment_id: string;
}

const PixCheckout: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pix, setPix] = useState<PixResponse | null>(null);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const router = useRouter();
    const { items, clearCart } = useCart();
    // Resetar Pix e status ao mudar itens do carrinho
    useEffect(() => {
        setPix(null);
        setOrderStatus(null);
        setError(null);
    }, [items]);

    // Envia todos os itens do carrinho
    const description = items.length === 1 ? items[0].name : 'Compra de PDF';

    const handlePixPayment = async () => {
        setLoading(true);
        setError(null);
        setPix(null);
        setOrderStatus(null);
        try {
            if (!items || items.length === 0) {
                setError('Carrinho vazio ou produto não encontrado.');
                setLoading(false);
                return;
            }
            const res = await fetch('/api/mercado-pago/pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    description,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || (data.details ? JSON.stringify(data.details) : 'Erro ao criar pagamento Pix'));
            
            // Log do payment ID para facilitar debugging
            console.log('═══════════════════════════════════════════════════════');
            console.log('✅ PIX GERADO COM SUCESSO!');
            console.log('Payment ID:', data.payment_id);
            console.log('Para verificar manualmente:');
            console.log(`node scripts/check-pix-payment.js ${data.payment_id}`);
            console.log('═══════════════════════════════════════════════════════');
            
            setPix(data);
            setOrderStatus('pending'); // ✅ Definir status como pending assim que o Pix for gerado
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Erro desconhecido ao criar pagamento Pix');
            }
        } finally {
            setLoading(false);
        }
    };

    // Função para verificar manualmente o status do pagamento
    const handleCheckStatus = async () => {
        if (!pix?.payment_id) return;
        
        setChecking(true);
        setError(null);
        try {
            const res = await fetch(`/api/mercado-pago/check-payment?paymentId=${pix.payment_id}`);
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Erro ao verificar pagamento');
            }

            console.log('[PixCheckout] Verificação manual:', data);
            
            if (data.database?.status) {
                setOrderStatus(data.database.status);
                
                if (data.database.status === 'completed') {
                    // ✅ Limpar carrinho e redirecionar
                    clearCart();
                    router.push(`/obrigado?payment_id=${pix.payment_id}`);
                } else if (['cancelled', 'refunded', 'rejected'].includes(data.database.status)) {
                    router.push('/erro');
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Erro ao verificar status');
            }
        } finally {
            setChecking(false);
        }
    };

    // Consulta periódica ao status do pedido
    useEffect(() => {
        if (pix?.payment_id) {
            const interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/orders/status?paymentId=${pix.payment_id}`);
                    const data = await res.json();
                    if (data.status) {
                        setOrderStatus(data.status);
                        if (data.status === 'completed') {
                            clearInterval(interval);
                            // ✅ Limpar carrinho e redirecionar
                            clearCart();
                            router.push(`/obrigado?payment_id=${pix.payment_id}`);
                        } else if (['cancelled', 'refunded', 'rejected'].includes(data.status)) {
                            clearInterval(interval);
                            router.push('/erro');
                        }
                    }
                } catch { }
            }, 4000); // consulta a cada 4s
            return () => clearInterval(interval);
        }
    }, [pix?.payment_id, router, clearCart]);

    return (
        <div className="bg-[#F4F4F4] p-6 rounded-lg shadow-md flex flex-col items-center">
            <Button
                className="bg-[#FED466] text-black px-4 py-2 rounded font-bold mb-4 hover:bg-[#FD9555]"
                onClick={handlePixPayment}
                disabled={loading || [
                    'completed', 'cancelled', 'refunded', 'rejected', 'processing'
                ].includes(orderStatus || '')}
                aria-disabled={(loading || [
                    'completed', 'cancelled', 'refunded', 'rejected', 'processing'
                ].includes(orderStatus || '')) ? 'true' : 'false'}
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gerando Pix...</span>
                    </div>
                ) : 'Pagar com Pix'}
            </Button>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            
            {/* Spinner enquanto aguardando pagamento (só aparece DEPOIS de gerar o Pix) */}
            {pix && !loading && orderStatus === 'pending' && (
                <ShadcnSpinner label="Aguardando pagamento..." />
            )}
            
            {/* QR code só aparece se não estiver pago/cancelado/refundado/rejeitado */}
            {pix && !loading && orderStatus === 'pending' && (
                    <div className="flex flex-col items-center">
                        <Image
                            src={`data:image/png;base64,${pix.qr_code_base64}`}
                            alt="QR Code Pix"
                            width={192}
                            height={192}
                            className="w-48 h-48 mb-2 border-2 border-[#FED466]"
                        />
                        <div className="text-xs text-gray-700 break-all bg-white p-2 rounded">{pix.qr_code}</div>
                        {orderStatus && (
                            <div className="mt-2 text-sm font-semibold text-gray-700">Status: {orderStatus}</div>
                        )}
                        {/* Botão para verificar manualmente */}
                        <Button
                            onClick={handleCheckStatus}
                            disabled={checking}
                            variant="outline"
                            className="mt-4"
                        >
                            {checking ? 'Verificando...' : 'Já paguei, verificar agora'}
                        </Button>
                        {/* Mostrar Payment ID para debugging */}
                        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                            <div className="font-semibold mb-1">ID do Pagamento:</div>
                            <div className="font-mono break-all">{pix.payment_id}</div>
                            <div className="text-gray-600 mt-2 text-[10px]">
                                Use este ID para verificar manualmente se necessário
                            </div>
                        </div>
                    </div>
                )}
            {/* Status final */}
            {orderStatus && [
                'completed', 'cancelled', 'refunded', 'rejected'
            ].includes(orderStatus) && (
                    <div className="mt-4 text-lg font-bold text-gray-700">
                        {orderStatus === 'completed' && 'Pagamento aprovado!'}
                        {orderStatus === 'cancelled' && 'Pagamento cancelado.'}
                        {orderStatus === 'refunded' && 'Pagamento reembolsado.'}
                        {orderStatus === 'rejected' && 'Pagamento rejeitado.'}
                    </div>
                )}
        </div>
    );
};

export default PixCheckout;
