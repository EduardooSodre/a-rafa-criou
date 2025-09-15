'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, CreditCard, Building, Smartphone, Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('pix')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
  })

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simular processamento do pagamento
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Limpar carrinho e redirecionar
    clearCart()
    router.push('/obrigado')
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Carrinho vazio</h1>
          <p className="text-gray-600 mb-6">
            Adicione alguns produtos antes de finalizar a compra.
          </p>
          <Button asChild className="bg-primary hover:bg-secondary text-black">
            <Link href="/produtos">
              Ver Produtos
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/carrinho">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Carrinho
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Checkout */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium">PIX</div>
                            <div className="text-sm text-gray-600">
                              Pagamento instantâneo
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Recomendado
                          </Badge>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                      <RadioGroupItem value="cartao" id="cartao" disabled />
                      <Label htmlFor="cartao" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Cartão de Crédito</div>
                            <div className="text-sm text-gray-600">
                              Em breve
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                      <RadioGroupItem value="boleto" id="boleto" disabled />
                      <Label htmlFor="boleto" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-orange-600" />
                          <div>
                            <div className="font-medium">Boleto Bancário</div>
                            <div className="text-sm text-gray-600">
                              Em breve
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-gray-600">{item.variationName}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de processamento</span>
                    <span className="text-green-600">Grátis</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-secondary text-black"
                    size="lg"
                    disabled={loading || !formData.name || !formData.email || !formData.cpf}
                  >
                    {loading ? (
                      'Processando...'
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Finalizar Compra {formatPrice(totalPrice)}
                      </>
                    )}
                  </Button>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Transação 100% segura
                    </p>
                    <p>• Acesso imediato aos downloads após pagamento</p>
                    <p>• Garantia de 30 dias ou seu dinheiro de volta</p>
                    <p>• Suporte técnico incluso</p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}