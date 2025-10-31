'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useCart } from '@/contexts/cart-context'
import { useToast } from '@/components/ui/toast'

interface ProductVariation {
    id: string
    name: string
    price: number
    slug: string
    isActive: boolean
    sortOrder: number
    images?: string[]
    attributeValues?: {
        attributeId: string
        attributeName: string | null
        valueId: string
        value: string | null
    }[]
}

interface AddToCartSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: {
        id: string
        name: string
        slug: string
        price: number
        images?: string[]
        mainImage?: { data: string; alt: string } | null
        variations?: ProductVariation[]
    }
    onAddedToCart?: () => void
}

export function AddToCartSheet({ open, onOpenChange, product, onAddedToCart }: AddToCartSheetProps) {
    const { addItem, items, openCartSheet } = useCart()
    const { showToast } = useToast()
    const [selection, setSelection] = useState<Record<string, string>>({})
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Filtrar apenas variações ativas com atributos
    const validVariations = useMemo(() => {
        return product.variations?.filter(v =>
            v.isActive && v.attributeValues && v.attributeValues.length > 0
        ) || []
    }, [product.variations])

    // Criar array de todas as imagens disponíveis (produto + TODAS as variações)
    const allAvailableImages = useMemo(() => {
        const productImages = product.images && product.images.length > 0
            ? product.images
            : (product.mainImage?.data ? [product.mainImage.data] : [])
        const variationImages = validVariations.flatMap(v => v.images || [])
        const allImages = [...productImages, ...variationImages]
        const filtered = allImages.filter((img, index, self) => self.indexOf(img) === index)
        return filtered.length > 0 ? filtered : ['/file.svg']
    }, [product.images, product.mainImage, validVariations])

    // Reset ao abrir
    useEffect(() => {
        if (open) {
            setSelection({})
            setCurrentImageIndex(0)
        }
    }, [open])

    // Se não há variações ou só tem uma, fecha e adiciona direto
    useEffect(() => {
        if (!open || validVariations.length === 0) return

        if (validVariations.length === 1) {
            const variation = validVariations[0]
            const variationImage = variation.images?.[0] || product.mainImage?.data || product.images?.[0] || '/file.svg'

            addItem({
                id: `${product.id}-${variation.id}`,
                productId: product.id,
                variationId: variation.id,
                name: product.name,
                price: variation.price,
                variationName: variation.name,
                image: variationImage,
                attributes: variation.attributeValues?.map(attr => ({
                    name: attr.attributeName || '',
                    value: attr.value || ''
                })) || []
            })
            showToast('Produto adicionado ao carrinho!', 'success')
            onOpenChange(false)
            openCartSheet()
        }
    }, [open, validVariations, product, addItem, showToast, onOpenChange, openCartSheet])

    // Encontrar variação selecionada
    const selectedVariation = useMemo(() => {
        return validVariations.find(v => {
            return Object.entries(selection).every(([attrName, value]) =>
                v.attributeValues?.some(attr => attr.attributeName === attrName && attr.value === value)
            )
        })
    }, [validVariations, selection])

    // Atualizar imagem quando variação mudar
    useEffect(() => {
        if (!selectedVariation) return

        if (selectedVariation.images && selectedVariation.images.length > 0) {
            const firstVariationImage = selectedVariation.images[0]
            const imageIndex = allAvailableImages.indexOf(firstVariationImage)

            if (imageIndex !== -1 && imageIndex !== currentImageIndex) {
                setCurrentImageIndex(imageIndex)
            }
        }
    }, [selectedVariation, allAvailableImages, currentImageIndex])

    // Navegação de imagens
    const handlePrevImage = () => {
        setCurrentImageIndex(prev => prev === 0 ? allAvailableImages.length - 1 : prev - 1)
    }

    const handleNextImage = () => {
        setCurrentImageIndex(prev => prev === allAvailableImages.length - 1 ? 0 : prev + 1)
    }

    // Agrupar atributos disponíveis
    const attributeGroups = useMemo(() => {
        const groups: Array<{ name: string; options: Array<{ value: string; isAvailable: boolean }> }> = []
        const attributeMap = new Map<string, Set<string>>()

        validVariations.forEach(variation => {
            variation.attributeValues?.forEach(attr => {
                if (attr.attributeName && attr.value) {
                    if (!attributeMap.has(attr.attributeName)) {
                        attributeMap.set(attr.attributeName, new Set())
                    }
                    attributeMap.get(attr.attributeName)?.add(attr.value)
                }
            })
        })

        attributeMap.forEach((values, attrName) => {
            const options = Array.from(values).map(value => {
                const isAvailable = validVariations.some(variation => {
                    const hasThisValue = variation.attributeValues?.some(
                        attr => attr.attributeName === attrName && attr.value === value
                    )
                    if (!hasThisValue) return false

                    return Object.entries(selection).every(([selectedAttr, selectedValue]) => {
                        if (selectedAttr === attrName) return true
                        return variation.attributeValues?.some(
                            attr => attr.attributeName === selectedAttr && attr.value === selectedValue
                        )
                    })
                })

                return { value, isAvailable }
            })

            groups.push({ name: attrName, options })
        })

        return groups
    }, [validVariations, selection])

    const handleFilterClick = (attributeName: string, value: string) => {
        setSelection(prev => {
            const newSelection = { ...prev }
            if (newSelection[attributeName] === value) {
                delete newSelection[attributeName]
            } else {
                newSelection[attributeName] = value
            }
            return newSelection
        })
    }

    const handleAddToCart = () => {
        if (!selectedVariation) {
            showToast('Por favor, selecione todas as opções', 'error')
            return
        }

        const alreadyInCart = items.some(item => item.productId === product.id && item.variationId === selectedVariation.id)
        if (alreadyInCart) {
            showToast('Este produto já está no carrinho!', 'info')
            onOpenChange(false)
            openCartSheet()
            return
        }

        const variationImage = selectedVariation.images?.[0] || null
        const productImage = product.images?.[0] || product.mainImage?.data || '/file.svg'
        const finalImage = variationImage || productImage

        addItem({
            id: `${product.id}-${selectedVariation.id}`,
            productId: product.id,
            variationId: selectedVariation.id,
            name: product.name,
            price: selectedVariation.price,
            variationName: selectedVariation.name,
            image: finalImage,
            attributes: selectedVariation.attributeValues?.map(attr => ({
                name: attr.attributeName || '',
                value: attr.value || ''
            })) || []
        })
        showToast('Produto adicionado ao carrinho!', 'success')
        onOpenChange(false)
        openCartSheet()
        if (onAddedToCart) onAddedToCart()
    }

    if (validVariations.length <= 1) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="max-h-[85vh] sm:max-h-[70vh] p-0 flex flex-col sm:mx-auto rounded-t-xl">
                <SheetHeader className="p-3 sm:p-4 border-b bg-gradient-to-br from-[#FD9555] to-[#FED466] rounded-t-xl">
                    <div className="flex items-start gap-2 sm:gap-3">
                        {allAvailableImages.length > 0 && (
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white rounded-lg overflow-hidden shadow-md">
                                <Image
                                    src={allAvailableImages[currentImageIndex] || '/file.svg'}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 80px, 96px"
                                />
                                {allAvailableImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevImage}
                                            className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-0.5 sm:p-1 shadow-sm transition-all"
                                            aria-label="Imagem anterior"
                                        >
                                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-0.5 sm:p-1 shadow-sm transition-all"
                                            aria-label="Próxima imagem"
                                        >
                                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
                                        </button>
                                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-black/60 text-white px-1 py-0.5 rounded text-[9px] sm:text-xs font-medium backdrop-blur-sm">
                                            {currentImageIndex + 1}/{allAvailableImages.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-white text-left text-base sm:text-xl leading-tight">
                                {product.name}
                            </SheetTitle>
                            <p className="text-xs sm:text-sm text-white/90 mt-1">
                                Selecione as opções desejadas
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {!selectedVariation && (
                        <div className="text-center py-4 text-muted-foreground text-xs sm:text-sm">
                            Selecione as opções para verificar disponibilidade
                        </div>
                    )}

                    {selectedVariation && (
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-lg sm:text-xl font-bold text-gray-900">
                                    R$ {selectedVariation.price.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 sm:space-y-4">
                        {attributeGroups.map((group) => (
                            <div key={group.name} className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-semibold text-gray-900">
                                    {group.name}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
                                    {group.options.map((option) => {
                                        const isSelected = selection[group.name] === option.value
                                        const isDisabled = !option.isAvailable

                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => handleFilterClick(group.name, option.value)}
                                                disabled={isDisabled}
                                                className={cn(
                                                    'relative px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all min-h-[44px]',
                                                    isSelected
                                                        ? 'border-[#FD9555] bg-[#FD9555]/10 text-[#FD9555]'
                                                        : isDisabled
                                                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                                                            : 'border-gray-300 bg-white text-gray-700 hover:border-[#FD9555]/50 hover:bg-[#FD9555]/5'
                                                )}
                                            >
                                                {option.value}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t p-3 sm:p-4 space-y-2 bg-white">
                    <Button
                        onClick={handleAddToCart}
                        disabled={!selectedVariation}
                        className="w-full bg-[#FD9555] hover:bg-[#FD9555]/90 text-white min-h-[44px] sm:min-h-[48px] text-sm sm:text-base font-semibold"
                    >
                        {!selectedVariation
                            ? 'Selecione as opções'
                            : `Adicionar ao carrinho - R$ ${selectedVariation.price.toFixed(2)}`
                        }
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}