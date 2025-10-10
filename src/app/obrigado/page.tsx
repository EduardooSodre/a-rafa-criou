'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, Mail, FileText, Star, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
    id: string
    name: string
    price: string
    quantity: number
    total: string
    variationName?: string | null
    productSlug?: string | null
}

interface OrderData {
    order: {
        id: string
        email: string
        status: string
        paymentStatus: string | null
        subtotal: string
        discountAmount: string | null
        total: string
        currency: string
        paymentProvider: string | null
        paidAt: Date | null
        createdAt: Date
    }
    items: OrderItem[]
}

export default function ObrigadoPage() {
    const searchParams = useSearchParams()
    const paymentIntent = searchParams.get('payment_intent')

    const [orderData, setOrderData] = useState<OrderData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)

    useEffect(() => {
        // Scroll to top when page loads
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0)
        }

        // Buscar dados do pedido com retry automático
        const fetchOrder = async (attempt = 1, maxRetries = 5) => {
            if (!paymentIntent) {
                setError('ID do pagamento não encontrado')
                setIsLoading(false)
                return
            }

            try {
                setRetryCount(attempt);

                const response = await fetch(`/api/orders/by-payment-intent?payment_intent=${paymentIntent}`)

                if (response.ok) {
                    const data = await response.json()
                    setOrderData(data)
                    setIsLoading(false)
                    return // Sucesso!
                }

                // Se não encontrou e ainda tem tentativas
                if (attempt < maxRetries) {
                    // Aguardar 2 segundos e tentar novamente
                    setTimeout(() => {
                        fetchOrder(attempt + 1, maxRetries)
                    }, 2000)
                    return
                }

                // Esgotou todas tentativas
                throw new Error('Pedido ainda está sendo processado')

            } catch (err) {
                console.error('Erro ao buscar pedido:', err)

                if (attempt < maxRetries) {
                    // Ainda tem tentativas, aguardar e tentar novamente
                    setTimeout(() => {
                        fetchOrder(attempt + 1, maxRetries)
                    }, 2000)
                } else {
                    // Esgotou tentativas, mostrar erro
                    setError(
                        'Seu pedido está sendo processado. ' +
                        'Por favor, recarregue esta página em alguns segundos ou ' +
                        'verifique seu email para confirmação.'
                    )
                    setIsLoading(false)
                }
            }
        }

        fetchOrder()
    }, [paymentIntent])

    const formatPrice = (price: string | number) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price
        return `R$ ${numPrice.toFixed(2).replace('.', ',')}`
    }

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Estados de loading e erro
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <Loader2 className="w-12 h-12 text-[#FED466] mx-auto mb-4 animate-spin" />
                    <h2 className="text-xl font-semibold mb-2">
                        {retryCount > 1 ? 'Aguardando confirmação do pagamento...' : 'Carregando dados do pedido...'}
                    </h2>
                    {retryCount > 1 && (
                        <p className="text-gray-600 text-sm">
                            Tentativa {retryCount}/5 - O webhook pode levar alguns segundos para processar.
                        </p>
                    )}
                </div>
            </div>
        )
    }

    if (error || !orderData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Pedido não encontrado
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {error || 'Não foi possível carregar os dados do seu pedido.'}
                    </p>
                    <Link href="/produtos">
                        <Button>
                            Voltar para Produtos
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Success Message */}
                <div className="text-center mb-8">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Parabéns! Compra realizada com sucesso
                    </h1>
                    <p className="text-gray-600">
                        Seu pagamento foi processado e você já pode acessar seus produtos digitais.
                    </p>
                </div>

                {/* Order Summary */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Detalhes do Pedido
                            <Badge variant="outline">#{orderData.order.id.slice(0, 8).toUpperCase()}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Data:</span>
                                <div className="font-medium">
                                    {formatDate(orderData.order.createdAt)}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600">Pagamento:</span>
                                <div className="font-medium">
                                    {orderData.order.paymentProvider === 'stripe' ? 'Cartão de Crédito' : orderData.order.paymentProvider?.toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600">Total:</span>
                                <div className="font-semibold text-[#FD9555]">
                                    {formatPrice(orderData.order.total)}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600">Status:</span>
                                <Badge className="bg-green-100 text-green-800">
                                    {orderData.order.status === 'completed' ? 'Aprovado' : orderData.order.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Downloads */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Seus Produtos ({orderData.items.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {orderData.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                            >
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                                    {item.variationName && (
                                        <p className="text-sm text-gray-600">{item.variationName}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {item.quantity}x {formatPrice(item.price)} = {formatPrice(item.total)}
                                    </p>
                                </div>
                                <Button className="bg-[#FED466] hover:bg-[#FED466]/90 text-black">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        ))}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-900">
                                        Links enviados por e-mail
                                    </p>
                                    <p className="text-blue-700">
                                        Enviamos os links de download para <strong>{orderData.order.email}</strong>.
                                        Verifique sua caixa de entrada e spam.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Important Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Informações Importantes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex gap-3">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Downloads ilimitados por 30 dias</p>
                                <p className="text-gray-600">
                                    Você pode baixar seus produtos quantas vezes quiser durante 30 dias.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Garantia de 30 dias</p>
                                <p className="text-gray-600">
                                    Não ficou satisfeito? Devolvemos 100% do seu dinheiro em até 30 dias.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Suporte técnico</p>
                                <p className="text-gray-600">
                                    Precisa de ajuda? Entre em contato conosco em suporte@arafacriou.com.br
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>O que fazer agora?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button asChild variant="outline" className="h-auto p-4">
                                <Link href="/produtos">
                                    <div className="text-left">
                                        <div className="font-medium flex items-center gap-2">
                                            <ArrowRight className="w-4 h-4" />
                                            Continuar Comprando
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            Explore mais produtos digitais
                                        </div>
                                    </div>
                                </Link>
                            </Button>

                            <Button asChild variant="outline" className="h-auto p-4">
                                <div className="text-left">
                                    <div className="font-medium flex items-center gap-2">
                                        <Star className="w-4 h-4" />
                                        Avalie sua Compra
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Ajude outros clientes
                                    </div>
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Message */}
                <div className="text-center text-gray-600">
                    <p className="text-sm">
                        Obrigado por confiar na <strong>A Rafa Criou</strong>! 🎉
                    </p>
                    <p className="text-xs mt-2">
                        Tem dúvidas? Entre em contato: suporte@arafacriou.com.br
                    </p>
                </div>
            </div>
        </div>
    )
}