'use client'

import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CarrinhoPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Seu carrinho está vazio</h1>
          <p className="text-gray-600 mb-6">
            Que tal adicionar alguns produtos incríveis?
          </p>
          <Button asChild className="bg-primary hover:bg-secondary text-black">
            <Link href="/produtos">
              Continuar Comprando
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8" />
          Meu Carrinho
          <Badge variant="secondary" className="ml-2">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'}
          </Badge>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Produtos */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.variationName}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="h-8 w-12 flex items-center justify-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(item.price)} cada
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/produtos">Continuar Comprando</Link>
              </Button>
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Carrinho
              </Button>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="coupon">Cupom de Desconto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="Digite seu cupom"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      Aplicar
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
                
                <Button 
                  asChild 
                  className="w-full bg-primary hover:bg-secondary text-black"
                  size="lg"
                >
                  <Link href="/checkout">
                    Finalizar Compra
                  </Link>
                </Button>
                
                <div className="text-xs text-gray-500 text-center space-y-1">
                  <p>• Download imediato após pagamento</p>
                  <p>• Garantia de 30 dias</p>
                  <p>• Suporte técnico incluso</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}