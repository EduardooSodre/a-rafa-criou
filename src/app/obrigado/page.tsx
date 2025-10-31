'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, Mail, FileText, Star, ArrowRight, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/contexts/cart-context'

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
    const paymentIntent = searchParams.get('payment_intent') // Stripe
    const paymentId = searchParams.get('payment_id') // Pix (Mercado Pago)
    const { clearCart } = useCart()

    const [orderData, setOrderData] = useState<OrderData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [downloadingItem, setDownloadingItem] = useState<string | null>(null)

    // ✅ Limpar carrinho ao entrar na página de obrigado (APENAS UMA VEZ)
    useEffect(() => {
        clearCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Array vazio = executa apenas uma vez

    useEffect(() => {
        // Scroll to top when page loads
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0)
        }

        // Buscar dados do pedido com retry automático
        const fetchOrder = async (attempt = 1, maxRetries = 5) => {
            // ✅ Aceitar tanto payment_intent (Stripe) quanto payment_id (Pix)
            if (!paymentIntent && !paymentId) {
                setError('ID do pagamento não encontrado')
                setIsLoading(false)
                return
            }

            try {
                setRetryCount(attempt);

                // ✅ Construir URL baseado no tipo de pagamento
                let url = '/api/orders/by-payment-intent?'
                if (paymentIntent) {
                    url += `payment_intent=${paymentIntent}`
                } else if (paymentId) {
                    url += `payment_id=${paymentId}`
                }

                const response = await fetch(url)

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
    }, [paymentIntent, paymentId])

    // If the order becomes approved, attempt to (re)send confirmation email via API once
    useEffect(() => {
        if (!orderData) return

        const order = orderData.order
        const paymentStatus = (order.paymentStatus || '').toLowerCase()
        const orderStatus = (order.status || '').toLowerCase()
        const isSuccess = orderStatus === 'completed' || paymentStatus === 'succeeded' || paymentStatus === 'paid'

        if (!isSuccess) return

        try {
            const key = `confirmationSent:${order.id}`
            if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
                // fire-and-forget; endpoint will return ok or error
                ; (async () => {
                    try {
                        const params = new URLSearchParams()
                        params.set('orderId', order.id)

                        const res = await fetch(`/api/orders/send-confirmation?${params.toString()}`)
                        if (!res.ok) {
                            const body = await res.text().catch(() => '')
                            console.error('Falha ao reenviar email de confirmação', res.status, body)
                        } else {
                            console.log('Email de confirmação enviado (via send-confirmation)')
                            localStorage.setItem(key, '1')
                        }
                    } catch (err) {
                        console.error('Erro ao chamar send-confirmation:', err)
                    }
                })()
            }
        } catch (e) {
            console.error('Erro ao tentar enviar confirmação (localStorage)', e)
        }
    }, [orderData])

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
                {/* Status Message (dinâmico) */}
                {(() => {
                    const order = orderData.order
                    const paymentStatus = (order.paymentStatus || '').toLowerCase()
                    const orderStatus = (order.status || '').toLowerCase()

                    const isSuccess = orderStatus === 'completed' || paymentStatus === 'succeeded' || paymentStatus === 'paid'
                    const isPending = ['pending', 'processing', 'requires_action', 'requires_payment_method'].includes(orderStatus) || ['pending', 'processing', 'requires_action'].includes(paymentStatus)
                    const isFailed = ['failed', 'canceled', 'cancelled', 'refunded', 'voided'].includes(orderStatus) || ['failed', 'canceled', 'refunded'].includes(paymentStatus)

                    const Icon = isSuccess ? CheckCircle : isPending ? Loader2 : (isFailed ? XCircle : XCircle)
                    const iconClass = isSuccess ? 'text-green-600' : isPending ? 'text-amber-500 animate-spin' : (isFailed ? 'text-red-600' : 'text-gray-600')

                    const title = isSuccess
                        ? 'Parabéns! Compra realizada com sucesso'
                        : isPending
                            ? 'Pedido recebido — aguardando confirmação'
                            : 'Pagamento não aprovado'

                    const subtitle = isSuccess
                        ? 'Seu pagamento foi processado e você já pode acessar seus produtos digitais.'
                        : isPending
                            ? 'Estamos aguardando a confirmação do pagamento. Você receberá um e-mail quando estiver aprovado.'
                            : 'O pagamento não foi aprovado. Verifique seu e-mail ou entre em contato com o suporte.'

                    return (
                        <div className="text-center mb-8">
                            <Icon className={`w-16 h-16 mx-auto mb-4 ${iconClass}`} />
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                            <p className="text-gray-600">{subtitle}</p>
                        </div>
                    )
                })()}

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
                                {(() => {
                                    const s = (orderData.order.status || '').toLowerCase()
                                    const p = (orderData.order.paymentStatus || '').toLowerCase()
                                    const isSuccess = s === 'completed' || p === 'succeeded' || p === 'paid'
                                    const isPending = ['pending', 'processing', 'requires_action', 'requires_payment_method'].includes(s) || ['pending', 'processing', 'requires_action'].includes(p)
                                    const isFailed = ['failed', 'canceled', 'cancelled', 'refunded', 'voided'].includes(s) || ['failed', 'canceled', 'refunded'].includes(p)

                                    if (isSuccess) {
                                        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
                                    }

                                    if (isPending) {
                                        return <Badge className="bg-amber-100 text-amber-800">Aguardando</Badge>
                                    }

                                    if (isFailed) {
                                        return <Badge className="bg-red-100 text-red-800">Pagamento não aprovado</Badge>
                                    }

                                    return <Badge className="bg-gray-100 text-gray-800">{orderData.order.status}</Badge>
                                })()}
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
                                {(orderData.order.status === 'completed' || orderData.order.paymentStatus === 'succeeded') ? (
                                    <Button
                                        className="bg-[#FED466] hover:bg-[#FED466]/90 text-black cursor-pointer"
                                        onClick={async () => {
                                            try {
                                                setDownloadingItem(item.id)
                                                // Call the secure download endpoint which validates order status and returns proxy URL
                                                const params = new URLSearchParams()
                                                if (paymentIntent) params.set('payment_intent', paymentIntent)
                                                if (paymentId) params.set('payment_id', paymentId)
                                                params.set('itemId', item.id)

                                                const res = await fetch(`/api/orders/download?${params.toString()}`)
                                                if (!res.ok) {
                                                    const body = await res.json().catch(() => ({}))
                                                    console.error('Download error', res.status, body)
                                                    setError('Erro ao iniciar download')
                                                    setDownloadingItem(null)
                                                    return
                                                }

                                                const data = await res.json()
                                                const downloadUrl = data?.downloadUrl || data?.signedUrl
                                                if (!downloadUrl) {
                                                    setError('URL de download não disponível')
                                                    setDownloadingItem(null)
                                                    return
                                                }

                                                // Open the proxy URL to trigger download in the browser
                                                window.open(downloadUrl, '_blank')
                                                setDownloadingItem(null)
                                            } catch (err) {
                                                console.error('Erro ao iniciar download:', err)
                                                setError('Erro ao iniciar download')
                                                setDownloadingItem(null)
                                            }
                                        }}
                                        disabled={!!downloadingItem}
                                    >
                                        {downloadingItem === item.id ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4 mr-2" />
                                        )}
                                        Download
                                    </Button>
                                ) : (
                                    <Button disabled variant="ghost" className="opacity-60 cursor-not-allowed">
                                        <Download className="w-4 h-4 mr-2" />
                                        Aguardando pagamento
                                    </Button>
                                )}
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

                {/* Important Information (legal copyright notice) */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Informações Importantes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="text-gray-800 space-y-2">
                            <p>
                                A Rafa Criou está garantida por Lei Federal de Direitos Autorais (Lei nº 9.610, 02/1998). O que cobre a possibilidade de publicações de marcas, artes e qualquer material criado pela loja sem a necessidade de aviso prévio. Através da mesma lei, caracteriza-se como crime a cópia, e/ou divulgação total ou parcial de materiais elaborados pela loja sem a autorização para uso comercial.
                            </p>

                            <p>
                                - Não é permitido distribuir, doar, repassar, revender, sub-licenciar ou compartilhar qualquer nossos produtos originais ou alterados em forma digital.
                            </p>

                            <p className="text-sm text-gray-600">
                                - A Rafa Criou <b>NÃO UTILIZA</b> de forma alguma qualquer material da associação Watchtower (domínio <b className='text-red-600'>jw.org</b>). Nossos arquivos são principalmente imagens 100% autorais ou geradas/alteradas via IA quando aplicável.
                            </p>
                            <p className="text-sm text-gray-600">
                                Temos total ciência que utilizar qualquer material da associação é errado e um crime.
                            </p>
                            <p className="text-sm text-red-600">
                                Pirataria é crime e não concordamos com tais atos.
                            </p>
                            <p className="text-sm text-red-600">
                                No caso de acusações envolvendo crimes contra a associação Watchtower, sua mensagem pode e será usada como prova judicial para danos morais quando aplicável (calúnia, difamação ou injúria).
                            </p>
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
                            <Button asChild variant="default" className="h-auto p-4 bg-[#FED466] text-black hover:bg-[#FD9555] border-2 border-[#FD9555] shadow-md">
                                <Link href="/produtos">
                                    <div className="text-left">
                                        <div className="font-medium flex items-center gap-2">
                                            <ArrowRight className="w-4 h-4" />
                                            Continuar Comprando
                                        </div>

                                    </div>
                                </Link>
                            </Button>

                            <Button asChild variant="outline" className="h-auto p-4 border-2 border-[#FED466] text-[#111827] hover:bg-[#FED466]/20 shadow-sm">
                                <div className="text-left">
                                    <div className="font-medium flex items-center gap-2">
                                        <Star className="w-4 h-4" />
                                        Avalie sua Compra
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
                        Tem dúvidas? Entre em contato: arafacriou@gmail.com
                    </p>
                </div>
            </div>
        </div>
    )
}