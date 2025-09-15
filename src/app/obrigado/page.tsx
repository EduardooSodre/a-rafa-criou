'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, Mail, FileText, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ObrigadoPage() {
    const [orderData] = useState({
        orderId: '#ORD-2024-001',
        customerName: 'Cliente',
        customerEmail: 'cliente@exemplo.com',
        items: [
            {
                id: '1',
                name: 'E-book: JavaScript Moderno',
                variationName: 'PDF + Códigos de Exemplo',
                downloadUrl: '#',
                price: 39.90
            }
        ],
        total: 39.90,
        paymentMethod: 'PIX',
        createdAt: new Date().toLocaleDateString('pt-BR')
    })

    useEffect(() => {
        // Scroll to top when page loads
        window.scrollTo(0, 0)
    }, [])

    const formatPrice = (price: number) => {
        return `R$ ${price.toFixed(2).replace('.', ',')}`
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
                            <Badge variant="outline">{orderData.orderId}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Data:</span>
                                <div className="font-medium">{orderData.createdAt}</div>
                            </div>
                            <div>
                                <span className="text-gray-600">Pagamento:</span>
                                <div className="font-medium">{orderData.paymentMethod}</div>
                            </div>
                            <div>
                                <span className="text-gray-600">Total:</span>
                                <div className="font-semibold text-primary">{formatPrice(orderData.total)}</div>
                            </div>
                            <div>
                                <span className="text-gray-600">Status:</span>
                                <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Downloads */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Seus Downloads
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
                                    <p className="text-sm text-gray-600">{item.variationName}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Preço: {formatPrice(item.price)}
                                    </p>
                                </div>
                                <Button className="bg-primary hover:bg-secondary text-black">
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
                                        Também enviamos os links de download para {orderData.customerEmail}.
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