'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
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
        mainImage?: { data: string; alt: string } | null
        variations?: ProductVariation[]
    }
    onAddedToCart?: () => void
}

export function AddToCartSheet({ open, onOpenChange, product, onAddedToCart }: AddToCartSheetProps) {
    const { addItem, items, openCartSheet } = useCart()
    const { showToast } = useToast()
    const [selectedFilters, setSelectedFilters] = useState<Map<string, string>>(new Map())
    const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null)

    // Filtrar apenas variações ativas com atributos (usando useMemo)
    const validVariations = useMemo(() => {
        return product.variations?.filter(v =>
            v.isActive && v.attributeValues && v.attributeValues.length > 0
        ) || []
    }, [product.variations])

    // Reset ao abrir
    useEffect(() => {
        if (open) {
            setSelectedFilters(new Map())
            setSelectedVariation(null)
        }
    }, [open])

    // Se não há variações ou só tem uma, fecha e adiciona direto
    useEffect(() => {
        if (!open || validVariations.length === 0) return

        if (validVariations.length === 1) {
            const variation = validVariations[0]
            const variationImage = variation.images && variation.images.length > 0 
                ? variation.images[0] 
                : null;
            const productImage = product.mainImage?.data || '/file.svg';
            
            addItem({
                id: `${product.id}-${variation.id}`,
                productId: product.id,
                variationId: variation.id,
                name: product.name,
                price: variation.price,
                variationName: variation.name,
                image: variationImage || productImage,
                attributes: variation.attributeValues?.map(attr => ({
                    name: attr.attributeName || '',
                    value: attr.value || ''
                })) || []
            })
            showToast('Produto adicionado ao carrinho!', 'success')
            onOpenChange(false)
            openCartSheet() // Abre o MobileCartSheet após adicionar
        }
    }, [open, validVariations, product, addItem, showToast, onOpenChange, openCartSheet])

    // Atualizar variação selecionada quando filtros mudarem
    useEffect(() => {
        if (selectedFilters.size === 0) {
            setSelectedVariation(null)
            return
        }

        const matchingVariation = validVariations.find(variation => {
            return Array.from(selectedFilters.entries()).every(([attrName, value]) => {
                return variation.attributeValues?.some(
                    attr => attr.attributeName === attrName && attr.value === value
                )
            })
        })

        setSelectedVariation(matchingVariation || null)
    }, [selectedFilters, validVariations])

    // Obter variações compatíveis baseado nos filtros selecionados
    const getCompatibleVariations = useMemo(() => {
        if (selectedFilters.size === 0) return validVariations

        return validVariations.filter(variation => {
            return Array.from(selectedFilters.entries()).every(([attrName, value]) => {
                return variation.attributeValues?.some(
                    attr => attr.attributeName === attrName && attr.value === value
                )
            })
        })
    }, [selectedFilters, validVariations])

    // Agrupar atributos disponíveis (apenas das variações compatíveis)
    const attributeGroups = useMemo(() => {
        const compatibleVariations = getCompatibleVariations

        // Coletar ordem dos atributos
        const attributeOrder: string[] = []
        const attributeGroupsMap = new Map<string, Set<string>>()

        // Ordem dos atributos de todas as variações
        validVariations.forEach(variation => {
            variation.attributeValues?.forEach(attr => {
                if (attr.attributeName && !attributeOrder.includes(attr.attributeName)) {
                    attributeOrder.push(attr.attributeName)
                }
            })
        })

        // Popular valores apenas das compatíveis
        compatibleVariations.forEach(variation => {
            variation.attributeValues?.forEach(attr => {
                if (attr.attributeName && attr.value) {
                    if (!attributeGroupsMap.has(attr.attributeName)) {
                        attributeGroupsMap.set(attr.attributeName, new Set())
                    }
                    attributeGroupsMap.get(attr.attributeName)?.add(attr.value)
                }
            })
        })

        // Retornar em ordem
        const orderedGroups = new Map<string, Set<string>>()
        attributeOrder.forEach(attrName => {
            if (attributeGroupsMap.has(attrName)) {
                orderedGroups.set(attrName, attributeGroupsMap.get(attrName)!)
            }
        })

        return orderedGroups
    }, [getCompatibleVariations, validVariations])

    // Handler para clique em filtro
    const handleFilterClick = (attributeName: string, value: string) => {
        setSelectedFilters(prev => {
            const newFilters = new Map(prev)
            if (newFilters.get(attributeName) === value) {
                newFilters.delete(attributeName)
            } else {
                newFilters.set(attributeName, value)
            }
            return newFilters
        })
    }

    const handleAddToCart = () => {
        if (!selectedVariation) {
            showToast('Por favor, selecione todas as opções', 'error')
            return
        }
        // Impede duplicidade: se já está no carrinho, não adiciona novamente
        const alreadyInCart = items.some(item => item.productId === product.id && item.variationId === selectedVariation.id)
        if (alreadyInCart) {
            showToast('Produto já está no carrinho!', 'info')
            onOpenChange(false)
            return
        }
        
        const variationImage = selectedVariation.images && selectedVariation.images.length > 0 
            ? selectedVariation.images[0] 
            : null;
        const productImage = product.mainImage?.data || '/file.svg';
        
        addItem({
            id: `${product.id}-${selectedVariation.id}`,
            productId: product.id,
            variationId: selectedVariation.id,
            name: product.name,
            price: selectedVariation.price,
            variationName: selectedVariation.name,
            image: variationImage || productImage,
            attributes: selectedVariation.attributeValues?.map(attr => ({
                name: attr.attributeName || '',
                value: attr.value || ''
            })) || []
        })
        showToast('Produto adicionado ao carrinho!', 'success')
        onOpenChange(false)
        openCartSheet() // Abre o MobileCartSheet após adicionar
        if (onAddedToCart) onAddedToCart();
    }

    const currentPrice = selectedVariation?.price || product.price
    const allAttributesSelected = selectedFilters.size === attributeGroups.size

    // Não renderizar se não houver variações válidas
    if (validVariations.length <= 1) {
        return null
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="max-h-[75vh] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b bg-[#FD9555] text-white">
                    <div className="flex items-start gap-3">
                        {product.mainImage?.data && (
                            <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                                <Image
                                    src={product.mainImage.data}
                                    alt={product.mainImage.alt}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <SheetTitle className="text-white text-left text-lg">
                                {product.name}
                            </SheetTitle>
                            <p className="text-sm text-white/80 mt-1">
                                Selecione as opções desejadas
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Indicador de progresso - quantidade removida, só pode comprar 1 */}
                    <div className="bg-[#FED466]/20 p-3 rounded-lg border border-[#FED466]/50">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-gray-700">
                                {selectedFilters.size} de {attributeGroups.size} selecionados
                            </span>
                            <span className="text-gray-600">
                                {getCompatibleVariations.length} {getCompatibleVariations.length === 1 ? 'opção disponível' : 'opções disponíveis'}
                            </span>
                        </div>
                    </div>

                    {/* Atributos */}
                    {Array.from(attributeGroups.entries()).map(([attrName, values]) => (
                        <div key={attrName} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-gradient-to-b from-[#FD9555] to-[#FED466] rounded-full"></div>
                                <label className="font-bold text-base text-gray-800">
                                    {attrName}
                                </label>
                                {selectedFilters.has(attrName) && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                        ✓ Selecionado
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {Array.from(values).map(value => {
                                    const isSelected = selectedFilters.get(attrName) === value

                                    return (
                                        <button
                                            key={value}
                                            onClick={() => handleFilterClick(attrName, value)}
                                            className={cn(
                                                // Reduced padding and radius for a more subtle UI
                                                "relative p-3 rounded-lg border-2 transition-all duration-200 text-center text-sm",
                                                isSelected
                                                    ? "border-[#FD9555] bg-[#FED466] shadow-sm"
                                                    : "border-gray-300 bg-white hover:border-[#FED466] hover:shadow-sm"
                                            )}
                                        >
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#FD9555] rounded-full flex items-center justify-center shadow-md">
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="font-bold text-base text-gray-900">
                                                {value}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer com preço e botão */}
                <div className="border-t p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Preço:</span>
                        <span className="text-2xl font-bold text-[#FD9555]">
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(currentPrice)}
                        </span>
                    </div>

                    <Button
                        onClick={handleAddToCart}
                        disabled={!allAttributesSelected}
                        // Smaller button height/text for subtler CTA
                        className="w-full py-3 text-base font-bold bg-[#FD9555] hover:bg-[#FD9555]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {allAttributesSelected ? 'Adicionar ao Carrinho' : 'Selecione todas as opções'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
