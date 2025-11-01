'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ShoppingCart, Trash2, ShoppingBag, Edit, QrCode } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EditCartItemSheet } from '@/components/sections/EditCartItemSheet'
import { useTranslation } from 'react-i18next'
import PixCheckout from '@/components/PixCheckout'
import InternationalCheckout from '@/components/InternationalCheckout'

export default function CarrinhoPage() {
    const { t, i18n } = useTranslation('common')
    const router = useRouter()
    const { items, totalItems, totalPrice, removeItem, clearCart } = useCart()
    const [editingItem, setEditingItem] = useState<string | null>(null)
    const [pixDialogOpen, setPixDialogOpen] = useState(false)
    const [pixName, setPixName] = useState('')
    const [pixEmail, setPixEmail] = useState('')
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string
        discount: number
        type: string
        value: string
    } | null>(null)
    const [couponError, setCouponError] = useState('')
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
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
        const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'es' ? 'es-ES' : 'en-US'
        const currency = i18n.language === 'pt' ? 'BRL' : i18n.language === 'es' ? 'EUR' : 'USD'

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price)
    }

    // Handler para aplicar cupom
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Digite um código de cupom')
            return
        }

        setIsApplyingCoupon(true)
        setCouponError('')

        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode.trim(),
                    cartItems: items,
                    cartTotal: totalPrice
                })
            })

            const data = await response.json()

            if (!response.ok) {
                setCouponError(data.error || 'Erro ao aplicar cupom')
                setAppliedCoupon(null)
                return
            }

            setAppliedCoupon({
                code: data.coupon.code,
                discount: data.discount,
                type: data.coupon.type,
                value: data.coupon.value
            })
            setCouponError('')
        } catch (error) {
            console.error('Erro:', error)
            setCouponError('Erro ao validar cupom')
            setAppliedCoupon(null)
        } finally {
            setIsApplyingCoupon(false)
        }
    }

    // Handler para remover cupom
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode('')
        setCouponError('')
    }

    // Calcular total final com desconto
    const finalTotal = appliedCoupon ? totalPrice - appliedCoupon.discount : totalPrice

    // Handler para PIX
    const handlePixCheckout = () => {
        if (!pixName || !pixEmail) {
            alert('Preencha seu nome e e-mail')
            return
        }

        // Redirecionar para checkout PIX
        router.push(`/checkout/pix?email=${encodeURIComponent(pixEmail)}&name=${encodeURIComponent(pixName)}`)
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('cart.empty')}</h1>
                    <p className="text-gray-600 mb-6">
                        {t('cart.emptyMessage')}
                    </p>
                    <Button asChild className="bg-primary hover:bg-secondary text-black">
                        <Link href="/produtos">
                            {t('cart.continueShopping')}
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
                                {t('cart.title')}
                            </h1>
                            <Badge variant="secondary" className="w-fit bg-[#FED466] text-gray-900 px-4 py-2 text-sm font-medium">
                                {totalItems} {totalItems === 1 ? t('cart.item') : t('cart.items')}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Lista de Produtos */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item, index) => {
                                const hasAttributes = item.attributes && item.attributes.length > 0
                                const hasVariations = productData.get(item.productId)?.variations?.some(v =>
                                    v.attributeValues && v.attributeValues.length > 0
                                )

                                return (
                                    <Card
                                        key={`${item.id}-${index}`}
                                        className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-[#FED466] overflow-hidden group"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                {/* Imagem do Produto - Modo Lista Minimalista */}
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 group-hover:border-[#FED466] transition-colors">
                                                    <Image
                                                        src={item.image}
                                                        alt={`Imagem de ${item.name}`}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        sizes="80px"
                                                    />
                                                </div>

                                                {/* Informações do Produto */}
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div>
                                                        <h3 className="font-bold text-base text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#FD9555] transition-colors">
                                                            {item.name}
                                                        </h3>

                                                        {/* Mostrar atributos ou nome da variação */}
                                                        {hasAttributes ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {item.attributes!.map((attr, idx) => (
                                                                    <Badge
                                                                        key={idx}
                                                                        variant="outline"
                                                                        className="bg-gradient-to-r from-[#FED466]/20 to-[#FED466]/10 text-gray-700 border-[#FED466]/50 text-xs px-2 py-0.5"
                                                                    >
                                                                        <span className="opacity-70">{attr.name}:</span>
                                                                        <span className="ml-1 font-semibold">{attr.value}</span>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-600 font-medium">
                                                                {item.variationName}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Controles: Editar e Remover */}
                                                    <div className="flex items-center gap-2">
                                                        {/* Botão Editar */}
                                                        {hasVariations && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="h-9 px-3 bg-white text-[#FD9555] hover:text-white hover:bg-[#FD9555] border border-[#FD9555] font-medium transition-all text-xs"
                                                                onClick={() => handleEditItem(item.id)}
                                                                aria-label={`Editar variação de ${item.name}`}
                                                            >
                                                                <Edit className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                                                                {t('cart.edit')}
                                                            </Button>
                                                        )}

                                                        {/* Botão Remover */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 px-3 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 font-medium transition-all text-xs"
                                                            onClick={() => removeItem(item.id)}
                                                            aria-label={`Remover ${item.name} do carrinho`}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                                                            {t('cart.remove')}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Preço - Alinhado à direita */}
                                                <div className="text-right space-y-1 flex-shrink-0">
                                                    <div className="text-lg font-bold text-[#FD9555]">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatPrice(item.price)} {t('cart.each')}
                                                    </div>
                                                    {item.quantity > 1 && (
                                                        <Badge className="bg-[#FED466]/30 text-gray-900 text-xs px-2 py-0.5">
                                                            x{item.quantity}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}


                            <div className="mt-6 pt-6 border-t-2 border-gray-200">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link href="/produtos" className="flex-1">
                                        <Button
                                            type="button"
                                            className="w-full h-12 bg-[#FED466] hover:bg-[#FED466]/80 text-gray-900 font-semibold border-2 border-[#FED466] hover:border-[#FD9555] transition-all duration-200 shadow-sm hover:shadow-md min-h-[48px]"
                                        >
                                            {t('cart.continueShopping')}
                                        </Button>
                                    </Link>
                                    <Button
                                        type="button"
                                        onClick={clearCart}
                                        className="flex-1 h-12 bg-red-50 text-red-700 hover:text-white hover:bg-red-600 border-2 border-red-200 hover:border-red-600 font-semibold transition-all duration-200 shadow-sm hover:shadow-md min-h-[48px]"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                                        {t('cart.clearCart')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Resumo do Pedido */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4 bg-white border-2 border-gray-200 shadow-lg overflow-hidden rounded-xl !p-0">
                                <div className="bg-gradient-to-r from-[#FED466] to-[#FD9555] px-6 py-4">
                                    <h3 className="text-gray-900 font-bold text-lg">{t('cart.orderSummary')}</h3>
                                </div>
                                <div className="space-y-5 p-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 font-medium">{t('cart.subtotal')} ({totalItems} {totalItems === 1 ? t('cart.item') : t('cart.items')})</span>
                                        <span className="text-lg font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                                    </div>

                                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                        <Label htmlFor="coupon" className="text-sm font-semibold text-gray-700">{t('cart.coupon')}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="coupon"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder={t('cart.couponPlaceholder')}
                                                className="flex-1 h-11 border-2 focus:border-[#FD9555]"
                                                disabled={!!appliedCoupon}
                                            />
                                            {appliedCoupon ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleRemoveCoupon}
                                                    className="h-11 px-4 !bg-red-500 !text-white border-2 !border-red-500 font-semibold hover:!bg-red-600 transition-all duration-200 cursor-pointer"
                                                >
                                                    Remover
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleApplyCoupon}
                                                    disabled={isApplyingCoupon}
                                                    className="h-11 px-4 !bg-white !text-gray-900 border-2 !border-gray-300 font-semibold hover:!bg-[#FD9555] hover:!text-white hover:!border-[#FD9555] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isApplyingCoupon ? 'Aplicando...' : t('cart.apply')}
                                                </Button>
                                            )}
                                        </div>
                                        {couponError && (
                                            <p className="text-sm text-red-600 font-medium">{couponError}</p>
                                        )}
                                        {appliedCoupon && (
                                            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                                                <div>
                                                    <p className="text-sm font-semibold text-green-700">
                                                        Cupom {appliedCoupon.code} aplicado!
                                                    </p>
                                                    <p className="text-xs text-green-600">
                                                        {appliedCoupon.type === 'percent'
                                                            ? `${appliedCoupon.value}% de desconto`
                                                            : `R$ ${parseFloat(appliedCoupon.value).toFixed(2)} de desconto`}
                                                    </p>
                                                </div>
                                                <span className="text-green-700 font-bold">
                                                    -{formatPrice(appliedCoupon.discount)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="flex justify-between items-center py-3 bg-[#FED466]/20 px-4 rounded-lg">
                                        <span className="font-bold text-gray-900 text-lg">{t('cart.total')}</span>
                                        <span className="text-2xl font-bold text-[#FD9555]">{formatPrice(finalTotal)}</span>
                                    </div>



                                    {/* Botão PIX */}
                                    <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200"
                                                size="lg"
                                            >
                                                <QrCode className="w-5 h-5 mr-2" />
                                                Pix e cartão de crédito/débito (Brasil)
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Pagar com PIX</DialogTitle>
                                                <DialogDescription>
                                                    Preencha seus dados para gerar o QR Code PIX
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 pt-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="pix-name">Nome completo</Label>
                                                    <Input
                                                        id="pix-name"
                                                        placeholder="Seu nome"
                                                        value={pixName}
                                                        onChange={(e) => setPixName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="pix-email">E-mail</Label>
                                                    <Input
                                                        id="pix-email"
                                                        type="email"
                                                        placeholder="seu@email.com"
                                                        value={pixEmail}
                                                        onChange={(e) => setPixEmail(e.target.value)}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handlePixCheckout}
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                >
                                                    Gerar QR Code PIX
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Botões de Pagamento */}
                                    <div className="flex flex-col gap-3">
                                        {/* Pagamento Internacional */}
                                        <InternationalCheckout
                                            appliedCoupon={appliedCoupon}
                                            finalTotal={finalTotal}
                                        />

                                        {/* PixCheckout: botão Pix e QR Code */}
                                        <div className="w-full">
                                            <PixCheckout
                                                appliedCoupon={appliedCoupon}
                                                finalTotal={finalTotal}
                                            />
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-600 text-center space-y-1 pt-2">
                                        <p className="flex items-center justify-center gap-1">
                                            <span className="text-green-600 font-bold">✓</span>
                                            {t('cart.immediateDownload')}
                                        </p>
                                    </div>
                                </div>
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