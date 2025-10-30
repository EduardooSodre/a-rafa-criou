
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import ShadcnSpinner from './ShadcnSpinner';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';

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
    const router = useRouter();
    const { items } = useCart();
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
            setPix(data);
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
                            router.push('/obrigado');
                        } else if (['cancelled', 'refunded', 'rejected'].includes(data.status)) {
                            clearInterval(interval);
                            router.push('/erro');
                        }
                    }
                } catch { }
            }, 4000); // consulta a cada 4s
            return () => clearInterval(interval);
        }
    }, [pix?.payment_id, router]);

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
                {loading ? 'Gerando Pix...' : 'Pagar com Pix'}
            </Button>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {/* Spinner enquanto aguardando pagamento */}
            {pix && !orderStatus && (
                <ShadcnSpinner label="Aguardando pagamento..." />
            )}
            {/* QR code só aparece se não estiver pago/cancelado/refundado/rejeitado */}
            {pix && orderStatus && ![
                'completed', 'cancelled', 'refunded', 'rejected'
            ].includes(orderStatus) && (
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
