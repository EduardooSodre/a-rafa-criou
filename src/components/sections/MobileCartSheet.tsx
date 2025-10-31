'use client'

import { useCart } from '@/contexts/cart-context'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface MobileCartSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MobileCartSheet({ open, onOpenChange }: MobileCartSheetProps) {
    const { items, totalItems, totalPrice, removeItem } = useCart()
    const router = useRouter()

    const handleCheckout = () => {
        onOpenChange(false)
        router.push('/carrinho')
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[90vw] sm:w-[380px] p-0 flex flex-col" aria-describedby="cart-description">
                <SheetTitle className="sr-only">Carrinho de Compras</SheetTitle>
                <p id="cart-description" className="sr-only">
                    Visualize e gerencie os produtos no seu carrinho de compras
                </p>

                {/* Header */}
                <header className="p-4 border-b bg-gradient-to-r from-[#FD9555] to-[#FED466]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-white" aria-hidden="true" />
                            <h2 className="text-lg font-bold text-white">
                                Carrinho
                            </h2>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30 text-sm font-bold px-3 py-1">
                            {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                        </Badge>
                    </div>
                </header>

                {/* Content */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" aria-hidden="true" />
                        <p className="text-gray-700 mb-2 font-semibold">Seu carrinho está vazio</p>
                        <p className="text-sm text-gray-500">Adicione produtos para continuar</p>
                    </div>
                ) : (
                    <>
                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="list">
                            {items.map((item) => (
                                <article
                                    key={item.id}
                                    className="relative flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                    role="listitem"
                                >
                                    {/* Botão de Excluir - Acessível */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 text-red-600 hover:text-white hover:bg-red-600 z-10 transition-colors"
                                        onClick={() => removeItem(item.id)}
                                        aria-label={`Remover ${item.name} do carrinho`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    {/* Image */}
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-md overflow-hidden border border-gray-200">
                                        <Image
                                            src={item.image || '/file.svg'}
                                            alt={`Imagem de ${item.name}`}
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 pr-8">
                                        <h3 className="font-bold text-sm text-gray-900 mb-1.5 line-clamp-2">
                                            {item.name}
                                        </h3>

                                        {/* Atributos selecionados */}
                                        {item.attributes && item.attributes.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {item.attributes.map((attr, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="outline"
                                                        className="bg-[#FED466]/20 text-gray-900 border-[#FED466]/50 text-xs px-2 py-0.5"
                                                    >
                                                        <span className="opacity-70">{attr.name}:</span>
                                                        <span className="ml-1 font-semibold">{attr.value}</span>
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-600 mb-2 font-medium">{item.variationName}</p>
                                        )}

                                        <div className="flex items-baseline gap-2">
                                            <p className="text-base font-bold text-[#FD9555]">
                                                {formatPrice(item.price)}
                                            </p>
                                            {item.quantity > 1 && (
                                                <span className="text-xs text-gray-500">
                                                    x{item.quantity}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Footer */}
                        <footer className="border-t p-4 space-y-3 bg-white shadow-lg">
                            {/* Total */}
                            <div className="flex items-center justify-between bg-[#FED466]/20 px-4 py-3 rounded-lg">
                                <span className="font-bold text-gray-900">Total:</span>
                                <span className="text-xl font-bold text-[#FD9555]">{formatPrice(totalPrice)}</span>
                            </div>

                            {/* Checkout Button */}
                            <Button
                                onClick={handleCheckout}
                                className="w-full bg-gradient-to-r from-[#FD9555] to-[#FD9555]/90 hover:from-[#FD9555]/90 hover:to-[#FD9555] text-white font-bold py-3 text-base shadow-md hover:shadow-lg transition-all min-h-[48px]"
                            >
                                Finalizar Compra
                            </Button>

                            {/* Continue Shopping */}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false)
                                    window.location.href = '/#produtos'
                                }}
                                className="w-full text-sm font-semibold text-gray-900 border-2 hover:bg-gray-50 transition-colors min-h-[44px]"
                            >
                                Continuar Comprando
                            </Button>
                        </footer>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
