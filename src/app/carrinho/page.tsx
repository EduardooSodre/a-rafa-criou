'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag, Edit } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { EditCartItemSheet } from '@/components/sections/EditCartItemSheet'

export default function CarrinhoPage() {
    const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()
    const [editingItem, setEditingItem] = useState<string | null>(null)
    const [productData, setProductData] = useState<Map<string, {
        id: string
        name: string
        slug: string
        mainImage?: { data: string; alt: string } | null
        variations?: Array<{
            id: string
            name: string
            price: number
            slug: string
            isActive: boolean
            sortOrder: number
            attributeValues?: Array<{
                attributeId: string
                attributeName: string | null
                valueId: string
                value: string | null
            }>
        }>
    }>>(new Map())

    // Buscar dados completos dos produtos quando o carrinho carrega
    useEffect(() => {
        const fetchProductData = async () => {
            const uniqueProductIds = [...new Set(items.map(item => item.productId))]
            const newProductData = new Map(productData)
            let hasChanges = false
            
            for (const productId of uniqueProductIds) {
                if (newProductData.has(productId)) continue

                try {
                    const item = items.find(i => i.productId === productId)
                    if (!item) continue

                    const response = await fetch(`/api/products?slug=${item.name.toLowerCase().replace(/\s+/g, '-')}`)
                    const data = await response.json()
                    
                    if (data.products && data.products.length > 0) {
                        newProductData.set(productId, data.products[0])
                        hasChanges = true
                    }
                } catch (error) {
                    console.error('Error fetching product data:', error)
                }
            }

            if (hasChanges) {
                setProductData(newProductData)
            }
        }

        if (items.length > 0) {
            fetchProductData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length])

    const formatPrice = (price: number) => {
        return `R$ ${price.toFixed(2).replace('.', ',')}`
    }

    const handleEditItem = (itemId: string) => {
        setEditingItem(itemId)
    }

    const currentEditingItem = items.find(item => item.id === editingItem)
    const currentEditingProductData = currentEditingItem 
        ? productData.get(currentEditingItem.productId) 
        : null

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
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6 md:py-10">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 md:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <ShoppingCart className="w-7 h-7 md:w-8 md:h-8 text-[#FD9555]" />
                                Meu Carrinho
                            </h1>
                            <Badge variant="secondary" className="w-fit bg-[#FED466] text-gray-900 px-4 py-2 text-sm font-medium">
                                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Lista de Produtos */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item) => {
                                const hasAttributes = item.attributes && item.attributes.length > 0
                                const hasVariations = productData.get(item.productId)?.variations?.some(v => 
                                    v.attributeValues && v.attributeValues.length > 0
                                )

                                return (
                                <Card key={item.id} className="bg-white hover:shadow-lg transition-all duration-200 border-gray-200">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="flex gap-4">
                                            {/* Imagem do Produto */}
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    width={112}
                                                    height={112}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                                />
                                            </div>

                                            {/* Informações do Produto */}
                                            <div className="flex-1 min-w-0 space-y-3">
                                                <div>
                                                    <h3 className="font-bold text-base md:text-lg text-gray-900 mb-2 line-clamp-2">
                                                        {item.name}
                                                    </h3>
                                                
                                                    {/* Mostrar atributos ou nome da variação */}
                                                    {hasAttributes ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.attributes!.map((attr, idx) => (
                                                                <Badge
                                                                    key={idx}
                                                                    variant="outline"
                                                                    className="bg-[#FED466]/30 text-gray-900 border-[#FED466] text-xs font-semibold px-3 py-1 rounded-md"
                                                                >
                                                                    <span className="opacity-70">{attr.name}:</span>
                                                                    <span className="ml-1.5">{attr.value}</span>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-600 font-medium">
                                                            {item.variationName}
                                                        </p>
                                                    )}
                                            </div>
                                            
                                                {/* Controles: Quantidade, Editar e Remover */}
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                    {/* Quantidade */}
                                                    <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 w-10 p-0 hover:bg-[#FED466]/20 rounded-none border-r border-gray-300"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            <Minus className="w-4 h-4 text-gray-700" />
                                                        </Button>
                                                        <span className="h-10 w-12 sm:w-14 flex items-center justify-center text-sm font-bold text-gray-900">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 w-10 p-0 hover:bg-[#FED466]/20 rounded-none border-l border-gray-300"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus className="w-4 h-4 text-gray-700" />
                                                        </Button>
                                                    </div>
                                                    
                                                    {/* Botão Editar */}
                                                    {hasVariations && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-10 px-3 sm:px-4 text-[#FD9555] hover:text-white hover:bg-[#FD9555] border-2 border-[#FD9555] font-medium transition-all duration-200"
                                                            onClick={() => handleEditItem(item.id)}
                                                        >
                                                            <Edit className="w-4 h-4 sm:mr-2" />
                                                            <span className="hidden sm:inline">Editar</span>
                                                        </Button>
                                                    )}
                                                    
                                                    {/* Botão Remover */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 px-3 sm:px-4 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 sm:mr-2" />
                                                        <span className="hidden sm:inline">Remover</span>
                                                    </Button>
                                                </div>
                                        </div>

                                            {/* Preço */}
                                            <div className="ml-auto text-right space-y-1 flex-shrink-0">
                                                <div className="text-lg md:text-2xl font-bold text-[#FD9555]">
                                                    {formatPrice(item.price * item.quantity)}
                                                </div>
                                                <div className="text-xs md:text-sm text-gray-500 font-medium">
                                                    {formatPrice(item.price)} cada
                                                </div>
                                            </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )})}


                            <div className="mt-6 pt-6 border-t-2 border-gray-200">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button variant="outline" asChild className="flex-1 h-12 font-semibold border-2 hover:bg-gray-50">
                                        <Link href="/produtos">
                                            Continuar Comprando
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={clearCart}
                                        className="flex-1 h-12 text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-300 hover:border-red-600 font-semibold transition-all duration-200"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Limpar Carrinho
                                    </Button>
                                </div>
                            </div>
                    </div>

                        {/* Resumo do Pedido */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4 bg-white border-2 border-gray-200 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-[#FED466] to-[#FD9555] -m-[1px] rounded-t-lg">
                                    <CardTitle className="text-gray-900 font-bold text-lg">Resumo do Pedido</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                                        <span className="text-lg font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                                    </div>

                                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                        <Label htmlFor="coupon" className="text-sm font-semibold text-gray-700">Cupom de Desconto</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="coupon"
                                                placeholder="Digite seu cupom"
                                                className="flex-1 h-11 border-2 focus:border-[#FD9555]"
                                            />
                                            <Button variant="outline" size="sm" className="h-11 px-4 border-2 font-semibold hover:bg-[#FD9555] hover:text-white hover:border-[#FD9555]">
                                                Aplicar
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="flex justify-between items-center py-3 bg-[#FED466]/20 px-4 rounded-lg">
                                        <span className="font-bold text-gray-900 text-lg">Total</span>
                                        <span className="text-2xl font-bold text-[#FD9555]">{formatPrice(totalPrice)}</span>
                                    </div>

                                    <Button
                                        asChild
                                        className="w-full h-14 bg-gradient-to-r from-[#FD9555] to-[#FD9555]/90 hover:from-[#FD9555]/90 hover:to-[#FD9555] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                                        size="lg"
                                    >
                                        <Link href="/checkout">
                                            Finalizar Compra
                                        </Link>
                                    </Button>

                                    <div className="text-xs text-gray-600 text-center space-y-1 pt-2">
                                        <p className="flex items-center justify-center gap-1">
                                            <span className="text-green-600 font-bold">✓</span>
                                            Download imediato após pagamento
                                        </p>
                                    </div>
                            </CardContent>
                        </Card>
                    </div>
                    </div>
                </div>
            </div>

            {/* Sheet de edição */}
            {currentEditingItem && currentEditingProductData && (
                <EditCartItemSheet
                    open={editingItem !== null}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                    cartItem={currentEditingItem}
                    productData={currentEditingProductData}
                />
            )}
        </div>
    )
}