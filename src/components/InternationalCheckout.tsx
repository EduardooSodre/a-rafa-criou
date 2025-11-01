'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/cart-context'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { StripeCheckoutForm } from '@/components/checkout/StripeForm'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { CreditCard } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface InternationalCheckoutProps {
    appliedCoupon?: {
        code: string
        discount: number
        type: string
        value: string
    } | null
    finalTotal: number
}

export default function InternationalCheckout({ appliedCoupon, finalTotal }: InternationalCheckoutProps) {
    const { data: session } = useSession()
    const { items, totalPrice } = useCart()
    const [clientSecret, setClientSecret] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleInitiatePayment = async () => {
        setIsLoading(true)
        setError(null)

        // Validação
        if (!session?.user?.id || !session?.user?.email) {
            setError('Você precisa estar logado para pagar.')
            setIsLoading(false)
            return
        }

        if (!items.length || items.some(item => !item.productId || !item.quantity)) {
            setError('Carrinho inválido.')
            setIsLoading(false)
            return
        }

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
                    userId: session.user.id,
                    email: session.user.email,
                    couponCode: appliedCoupon?.code || null,
                    discount: appliedCoupon?.discount || 0,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar pagamento')
            }

            setClientSecret(data.clientSecret)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    className="w-full h-14 bg-gradient-to-r from-[#FD9555] to-[#FD9555]/90 hover:from-[#FD9555]/90 hover:to-[#FD9555] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagar Internacionalmente
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Pagamento Internacional</DialogTitle>
                    <DialogDescription>
                        Pague com cartão de crédito/débito via Stripe
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Resumo do Pedido */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Resumo do Pedido</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.name}</p>
                                        {item.variationName && (
                                            <p className="text-xs text-gray-600">{item.variationName}</p>
                                        )}
                                    </div>
                                    <p className="ml-2 font-semibold whitespace-nowrap">
                                        R$ {(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>R$ {totalPrice.toFixed(2)}</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Desconto ({appliedCoupon.code}):</span>
                                    <span>-R$ {appliedCoupon.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold">
                                <span>Total:</span>
                                <span className="text-[#FD9555]">R$ {finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED466]"></div>
                        </div>
                    )}

                    {/* Botão Iniciar Pagamento */}
                    {!clientSecret && !isLoading && (
                        <Button
                            onClick={handleInitiatePayment}
                            className="w-full bg-[#FED466] hover:bg-[#FED466]/90 text-black font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Preparando pagamento...' : 'Iniciar pagamento'}
                        </Button>
                    )}

                    {/* Formulário Stripe */}
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
                </div>
            </DialogContent>
        </Dialog>
    )
}
