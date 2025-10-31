'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    const [quantity, setQuantity] = useState(1)

    // Filtrar apenas variações ativas com atributos
    const validVariations = useMemo(() => {
        return product.variations?.filter(v =>
            v.isActive && v.attributeValues && v.attributeValues.length > 0
        ) || []
    }, [product.variations])

    // Usar apenas imagem de capa do produto
    const coverImage = product.mainImage?.data || product.images?.[0] || '/file.svg'

    // Reset ao abrir
    useEffect(() => {
        if (open) {
            setSelection({})
            setQuantity(1)
        }
    }, [open])

    // Se não há variações ou só tem uma, fecha e adiciona direto
    useEffect(() => {
        if (!open || validVariations.length === 0) return

        if (validVariations.length === 1) {
            const variation = validVariations[0]
            const variationImage = variation.images && variation.images.length > 0
                ? variation.images[0]
                : coverImage

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
    }, [open, validVariations, product, addItem, showToast, onOpenChange, openCartSheet, coverImage])

    // Encontrar variação selecionada
    const selectedVariation = useMemo(() => {
        return validVariations.find(v => {
            return Object.entries(selection).every(([attrName, value]) =>
                v.attributeValues?.some(attr => attr.attributeName === attrName && attr.value === value)
            )
        })
    }, [validVariations, selection])

    // Obter variações compatíveis baseado nos filtros selecionados
    const getCompatibleVariations = useMemo(() => {
        if (Object.keys(selection).length === 0) return validVariations

        return validVariations.filter(variation => {
            return Object.entries(selection).every(([attrName, value]) => {
                return variation.attributeValues?.some(
                    attr => attr.attributeName === attrName && attr.value === value
                )
            })
        })
    }, [selection, validVariations])

    // Agrupar atributos disponíveis - mostra TODAS as opções (como no produto/id)
    const attributeGroups = useMemo(() => {
        const groups: Array<{
            name: string
            options: Array<{ value: string; isAvailable: boolean }>
        }> = []

        const attributeMap = new Map<string, Set<string>>()

        // Coletar todos os atributos de TODAS as variações válidas
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

        // Para cada atributo, verificar disponibilidade de cada opção
        attributeMap.forEach((values, attrName) => {
            const options = Array.from(values).map(value => {
                // Verificar se existe variação compatível com esta opção
                // ignorando o atributo atual (para não desabilitar todas)
                const isAvailable = validVariations.some(variation => {
                    const hasThisValue = variation.attributeValues?.some(
                        attr => attr.attributeName === attrName && attr.value === value
                    )
                    if (!hasThisValue) return false

                    // Verificar se é compatível com outros atributos já selecionados
                    return Object.entries(selection).every(([selectedAttr, selectedValue]) => {
                        if (selectedAttr === attrName) return true // Ignora o atributo atual
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

    // Handler para clique em filtro
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

        // Impede duplicidade: se já está no carrinho, não adiciona novamente
        const alreadyInCart = items.some(item => item.productId === product.id && item.variationId === selectedVariation.id)
        if (alreadyInCart) {
            showToast('Produto já está no carrinho!', 'info')
            onOpenChange(false)
            return
        }

        // Usar a imagem da variação se disponível, senão usa a capa
        const selectedImage = (selectedVariation.images && selectedVariation.images.length > 0)
            ? selectedVariation.images[0]
            : coverImage

        addItem({
            id: `${product.id}-${selectedVariation.id}`,
            productId: product.id,
            variationId: selectedVariation.id,
            name: product.name,
            price: selectedVariation.price,
            variationName: selectedVariation.name,
            image: selectedImage,
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

    const currentPrice = selectedVariation?.price || product.price
    const allAttributesSelected = Object.keys(selection).length === attributeGroups.length

    // Não renderizar se não houver variações válidas
    if (validVariations.length <= 1) {
        return null
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="max-h-[85vh] p-0 flex flex-col">
                <SheetHeader className="p-3 border-b bg-[#FD9555] text-white">
                    <div className="flex items-start gap-2">
                        {/* Imagem de capa do produto */}
                        <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden shadow-md">
                            <Image
                                src={coverImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-white text-left text-base sm:text-lg leading-tight">
                                {product.name}
                            </SheetTitle>
                            <p className="text-xs sm:text-sm text-white/90 mt-1">
                                Selecione as opções desejadas
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {/* Indicador de progresso */}
                    <div className="bg-[#FED466]/20 p-2 rounded-lg border border-[#FED466]/50">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-semibold text-gray-700">
                                {Object.keys(selection).length} de {attributeGroups.length} selecionados
                            </span>
                            <span className="text-gray-600">
                                {getCompatibleVariations.length} {getCompatibleVariations.length === 1 ? 'opção disponível' : 'opções disponíveis'}
                            </span>
                        </div>
                    </div>

                    {/* Atributos - mostra TODAS as opções */}
                    {attributeGroups.map((group, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-4 bg-gradient-to-b from-[#FD9555] to-[#FED466] rounded-full"></div>
                                <label className="font-bold text-sm text-gray-800">
                                    {group.name}
                                </label>
                                {selection[group.name] && (
                                    <Badge variant="secondary" className="text-[10px] sm:text-xs bg-green-100 text-green-700">
                                        ✓ Selecionado
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {group.options.map((option) => {
                                    const isSelected = selection[group.name] === option.value
                                    const isDisabled = !option.isAvailable

                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handleFilterClick(group.name, option.value)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "relative px-2 py-1.5 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all min-h-[44px]",
                                                isSelected
                                                    ? "border-[#FD9555] bg-[#FED466] shadow-sm"
                                                    : isDisabled
                                                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                                                        : "border-gray-300 bg-white hover:border-[#FED466] hover:shadow-sm"
                                            )}
                                        >
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FD9555] rounded-full flex items-center justify-center shadow-md">
                                                    <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="font-bold text-sm text-gray-900">
                                                {option.value}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer com preço e botão */}
                <div className="border-t p-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Preço:</span>
                        <span className="text-lg sm:text-xl font-bold text-[#FD9555]">
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                            }).format(currentPrice)}
                        </span>
                    </div>

                    <Button
                        onClick={handleAddToCart}
                        disabled={!allAttributesSelected}
                        className="w-full py-2.5 text-sm sm:text-base font-bold bg-[#FD9555] hover:bg-[#FD9555]/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                        {allAttributesSelected ? 'Adicionar ao Carrinho' : 'Selecione todas as opções'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
