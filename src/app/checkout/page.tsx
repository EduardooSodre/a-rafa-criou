'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/contexts/cart-context';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeCheckoutForm } from '@/components/checkout/StripeForm';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { items, totalPrice } = useCart();
    const [clientSecret, setClientSecret] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirecionar se carrinho vazio
    useEffect(() => {
        if (items.length === 0) {
            router.push('/carrinho');
        }
    }, [items, router]);

    // Criar Payment Intent quando a página carrega
    useEffect(() => {
        if (items.length === 0) return;

        const createPaymentIntent = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/stripe/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: items.map((item) => ({
                            productId: item.productId,
                            variationId: item.variationId,
                            quantity: item.quantity,
                        })),
                        userId: session?.user?.id,
                        email: session?.user?.email,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao criar pagamento');
                }

                setClientSecret(data.clientSecret);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
                console.error('Erro ao criar Payment Intent:', err);
            } finally {
                setIsLoading(false);
            }
        };

        createPaymentIntent();
    }, [items, session?.user?.id, session?.user?.email]);

    if (items.length === 0) {
        return null; // Redirecionando...
    }

    return (
        <div className="min-h-screen bg-[#F4F4F4] py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-3xl font-bold mb-8">Finalizar Pedido</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Resumo do Pedido */}
                    <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
                        <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>

                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 pb-4 border-b">
                                    <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                                        <Image
                                            src={item.image || '/placeholder.png'}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                                        {item.variationName && (
                                            <p className="text-xs text-gray-600 mt-1">{item.variationName}</p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">Qtd: {item.quantity}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-semibold">
                                            R$ {(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span className="text-[#FD9555]">R$ {totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulário de Pagamento */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Pagamento</h2>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                                {error}
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED466]"></div>
                            </div>
                        )}

                        {!isLoading && !error && !clientSecret && (
                            <div className="text-center py-12 text-gray-500">
                                Preparando pagamento...
                            </div>
                        )}

                        {clientSecret && (
                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret,
                                    appearance: {
                                        theme: 'stripe',
                                        variables: {
                                            colorPrimary: '#FED466',
                                            colorBackground: '#ffffff',
                                            colorText: '#1a1a1a',
                                            colorDanger: '#ef4444',
                                            fontFamily: 'system-ui, sans-serif',
                                            borderRadius: '8px',
                                        },
                                    },
                                }}
                            >
                                <StripeCheckoutForm />
                            </Elements>
                        )}

                        <div className="mt-6 pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/carrinho')}
                                className="w-full"
                            >
                                Voltar ao Carrinho
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
