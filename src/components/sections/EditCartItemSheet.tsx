'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useCart, CartItem } from '@/contexts/cart-context'
import { useToast } from '@/components/ui/toast'

interface ProductVariation {
    id: string
    name: string
    price: number
    slug: string
    isActive: boolean
    sortOrder: number
    attributeValues?: {
        attributeId: string
        attributeName: string | null
        valueId: string
        value: string | null
    }[]
}

interface EditCartItemSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cartItem: CartItem
    productData: {
        id: string
        name: string
        slug: string
        mainImage?: { data: string; alt: string } | null
        variations?: ProductVariation[]
    }
}

export function EditCartItemSheet({ open, onOpenChange, cartItem, productData }: EditCartItemSheetProps) {
    const { updateItem } = useCart()
    const { showToast } = useToast()
    const [selectedFilters, setSelectedFilters] = useState<Map<string, string>>(new Map())
    const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null)

    // Filtrar apenas variações ativas com atributos
    const validVariations = useMemo(() => {
        return productData.variations?.filter(v =>
            v.isActive && v.attributeValues && v.attributeValues.length > 0
        ) || []
    }, [productData.variations])

    // Inicializar com os atributos atuais do item
    useEffect(() => {
        if (open && cartItem.attributes) {
            const initialFilters = new Map<string, string>()
            cartItem.attributes.forEach(attr => {
                initialFilters.set(attr.name, attr.value)
            })
            setSelectedFilters(initialFilters)

            // Encontrar a variação correspondente
            const variation = validVariations.find(v => v.id === cartItem.variationId)
            setSelectedVariation(variation || null)
        }
    }, [open, cartItem, validVariations])

    // Obter todas as combinações compatíveis baseadas nos filtros selecionados
    const getCompatibleVariations = useMemo(() => {
        if (selectedFilters.size === 0) return validVariations

        return validVariations.filter(variation => {
            return Array.from(selectedFilters.entries()).every(([attrName, value]) => {
                return variation.attributeValues?.some(
                    attr => attr.attributeName === attrName && attr.value === value
                )
            })
        })
    }, [validVariations, selectedFilters])

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

    // Agrupar atributos únicos
    const attributeGroups = useMemo(() => {
        const groups = new Map<string, Set<string>>()

        getCompatibleVariations.forEach(variation => {
            variation.attributeValues?.forEach(attr => {
                if (!attr.attributeName || !attr.value) return

                if (!groups.has(attr.attributeName)) {
                    groups.set(attr.attributeName, new Set())
                }
                groups.get(attr.attributeName)!.add(attr.value)
            })
        })

        return groups
    }, [getCompatibleVariations])

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

    const handleUpdate = () => {
        if (!selectedVariation) return

        updateItem(cartItem.id, {
            variationId: selectedVariation.id,
            variationName: selectedVariation.name,
            price: selectedVariation.price,
            attributes: selectedVariation.attributeValues?.map(attr => ({
                name: attr.attributeName || '',
                value: attr.value || ''
            })) || []
        })

        showToast('Produto atualizado com sucesso!', 'success')
        onOpenChange(false)
    }

    // Verificar se todos os atributos foram selecionados
    const allAttributesSelected = attributeGroups.size > 0 &&
        selectedFilters.size === attributeGroups.size

    if (validVariations.length === 0) {
        return null
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="h-[85vh] sm:h-[90vh] max-h-screen overflow-hidden p-0 flex flex-col"
            >
                {/* Header Fixo */}
                <SheetHeader className="bg-gradient-to-r from-[#FED466] to-[#FD9555] px-4 sm:px-6 py-3 flex-shrink-0 border-b-2 border-[#FD9555]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-white shadow-md flex-shrink-0 border border-white">
                            <Image
                                src={productData.mainImage?.data || '/file.svg'}
                                alt={productData.mainImage?.alt || productData.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-white text-base sm:text-lg font-bold">
                                Editar Produto
                            </SheetTitle>
                            <p className="text-white/95 text-xs sm:text-sm font-medium line-clamp-1">
                                {productData.name}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                {/* Conteúdo Scrollável */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-gray-50">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Indicador de progresso */}
                        <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                                        allAttributesSelected
                                            ? "bg-green-500 text-white"
                                            : "bg-blue-500 text-white"
                                    )}>
                                        {allAttributesSelected ? "✓" : selectedFilters.size}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm sm:text-base">
                                            {allAttributesSelected ? "Seleção Completa!" : "Selecione os Atributos"}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {selectedFilters.size} de {attributeGroups.size} selecionados
                                        </p>
                                    </div>
                                </div>
                                {allAttributesSelected && (
                                    <Badge className="bg-green-500 text-white px-3 py-1 text-xs sm:text-sm font-bold">
                                        Pronto ✓
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Seções de atributos */}
                        {Array.from(attributeGroups.entries()).map(([attributeName, values]) => (
                            <div key={attributeName} className="bg-white rounded-xl p-4 sm:p-5 shadow-md border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="font-bold text-gray-900 text-base sm:text-lg">
                                        {attributeName}
                                    </label>
                                    {selectedFilters.has(attributeName) && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 font-semibold px-3 py-1">
                                            ✓ {selectedFilters.get(attributeName)}
                                        </Badge>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                    {Array.from(values).map(value => {
                                        const isSelected = selectedFilters.get(attributeName) === value
                                        return (
                                            <button
                                                key={value}
                                                onClick={() => handleFilterClick(attributeName, value)}
                                                className={cn(
                                                    'px-3 sm:px-4 py-3 sm:py-4 rounded-xl border-2 text-sm sm:text-base font-semibold transition-all duration-200 hover:scale-105 active:scale-95',
                                                    isSelected
                                                        ? 'border-[#FD9555] bg-[#FD9555] text-white shadow-lg'
                                                        : 'border-gray-300 bg-white text-gray-700 hover:border-[#FD9555] hover:bg-[#FD9555]/10'
                                                )}
                                            >
                                                {value}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Fixo */}
                <div className="flex-shrink-0 bg-white border-t-2 border-gray-200 p-3 sm:p-4 shadow-xl">
                    <div className="max-w-2xl mx-auto space-y-3">
                        {selectedVariation && (
                            <div className="flex items-center justify-between bg-[#FED466]/30 px-3 sm:px-4 py-2 rounded-lg border border-[#FED466]">
                                <span className="text-gray-700 font-semibold text-xs sm:text-sm">Preço:</span>
                                <span className="text-xl sm:text-2xl font-bold text-[#FD9555]">
                                    R$ {selectedVariation.price.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </span>
                            </div>
                        )}
                        <Button
                            onClick={handleUpdate}
                            disabled={!allAttributesSelected}
                            className={cn(
                                "w-full h-11 sm:h-12 text-sm sm:text-base font-bold shadow-lg transition-all duration-200 cursor-pointer",
                                allAttributesSelected
                                    ? "bg-gradient-to-r from-[#FD9555] to-[#FD9555]/90 hover:from-[#FD9555]/90 hover:to-[#FD9555] text-white hover:shadow-xl hover:scale-[1.02]"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            )}
                            size="lg"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            {allAttributesSelected ? "Atualizar Produto" : "Selecione todos os atributos"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
