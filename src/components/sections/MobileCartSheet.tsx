'use client'

import { useCart } from '@/contexts/cart-context'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface MobileCartSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function MobileCartSheet({ open, onOpenChange }: MobileCartSheetProps) {
    const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart()
    const router = useRouter()

    const handleCheckout = () => {
        onOpenChange(false)
        router.push('/checkout')
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[90vw] sm:w-[400px] p-0 flex flex-col">
                <SheetTitle className="sr-only">Carrinho de Compras</SheetTitle>

                {/* Header */}
                <div className="p-4 border-b bg-[#FD9555]">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-bold text-white">
                            Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                        </h2>
                    </div>
                </div>

                {/* Content */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-2">Seu carrinho está vazio</p>
                        <p className="text-sm text-gray-400">Adicione produtos para continuar</p>
                    </div>
                ) : (
                    <>
                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                    {/* Image */}
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-md overflow-hidden">
                                        <Image
                                            src={item.image || '/placeholder.png'}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-2">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-2">{item.variationName}</p>
                                        <p className="text-sm font-bold text-[#FD9555]">
                                            {formatPrice(item.price)}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className="text-sm font-medium w-8 text-center">
                                                {item.quantity}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 ml-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t p-4 space-y-3 bg-white">
                            {/* Total */}
                            <div className="flex items-center justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span className="text-[#FD9555]">{formatPrice(totalPrice)}</span>
                            </div>

                            {/* Checkout Button */}
                            <Button
                                onClick={handleCheckout}
                                className="w-full bg-[#FD9555] hover:bg-[#E88544] text-white font-bold py-6 text-base"
                            >
                                Finalizar Compra
                            </Button>

                            {/* Continue Shopping */}
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full"
                            >
                                Continuar Comprando
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
