
import Image from 'next/image';
import React, { useState } from 'react';
import { useCart } from '@/contexts/cart-context';

interface PixResponse {
    qr_code: string;
    qr_code_base64: string;
    payment_id: string;
}

const PixCheckout: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pix, setPix] = useState<PixResponse | null>(null);
    const { items } = useCart();

    // Envia todos os itens do carrinho
    const description = items.length === 1 ? items[0].name : 'Compra de PDF';

    const handlePixPayment = async () => {
        setLoading(true);
        setError(null);
        setPix(null);
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

    return (
        <div className="bg-[#F4F4F4] p-6 rounded-lg shadow-md flex flex-col items-center">
            <button
                className="bg-[#FED466] text-black px-4 py-2 rounded font-bold mb-4 hover:bg-[#FD9555]"
                onClick={handlePixPayment}
                disabled={loading}
            >
                {loading ? 'Gerando Pix...' : 'Pagar com Pix'}
            </button>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {pix && (
                <div className="flex flex-col items-center">
                    <Image
                        src={`data:image/png;base64,${pix.qr_code_base64}`}
                        alt="QR Code Pix"
                        width={192}
                        height={192}
                        className="w-48 h-48 mb-2 border-2 border-[#FED466]"
                    />
                    <div className="text-xs text-gray-700 break-all bg-white p-2 rounded">{pix.qr_code}</div>
                </div>
            )}
        </div>
    );
};

export default PixCheckout;
