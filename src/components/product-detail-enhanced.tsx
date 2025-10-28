'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingCart, Star, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ProductVariation {
    id: string
    name: string
    price: number
    description: string
    downloadLimit: number
    fileSize: string
    images?: string[]  // Adicionado: imagens da variação
    attributeValues?: {
        attributeId: string
        attributeName?: string | null
        valueId: string
        value?: string | null
    }[]
}

interface Product {
    id: string
    name: string
    slug: string
    description: string
    longDescription: string
    basePrice: number
    category: string
    tags: string[]
    images: string[]
    variations: ProductVariation[]
}

interface ProductDetailEnhancedProps {
    product: Product
}

export function ProductDetailEnhanced({ product }: ProductDetailEnhancedProps) {
    const { t } = useTranslation('common')
    const router = useRouter()
    const { addItem } = useCart()
    const { showToast } = useToast()

    // Estado para controle de imagens
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [displayedImages, setDisplayedImages] = useState<string[]>(product.images)

    // Filtrar apenas variações que têm relação (com attributeValues válidos ou arquivos)
    const validVariations = product.variations.filter(v => {
        const hasAttributes = v.attributeValues && v.attributeValues.length > 0
        const hasValidAttrs = hasAttributes && v.attributeValues!.some(attr => attr.value !== null)
        return hasValidAttrs || (v.images && v.images.length > 0)
    })

    const [selectedVariation, setSelectedVariation] = useState(
        validVariations.length > 0 ? validVariations[0].id : ''
    )

    // Estado para filtros de atributos (novo sistema de seleção)
    const [selectedFilters, setSelectedFilters] = useState<Map<string, string>>(new Map())

    const currentVariation = validVariations.find(v => v.id === selectedVariation)
    const currentPrice = currentVariation?.price || product.basePrice

    // Filtrar variações compatíveis baseado nos filtros selecionados
    const getCompatibleVariations = () => {
        if (selectedFilters.size === 0) return validVariations

        return validVariations.filter(variation => {
            return Array.from(selectedFilters.entries()).every(([attrName, value]) => {
                return variation.attributeValues?.some(
                    attr => attr.attributeName === attrName && attr.value === value
                )
            })
        })
    }

    // Agrupar variações por atributos únicos - APENAS variações compatíveis
    // Mantém a ordem consistente dos atributos
    const getAvailableAttributeGroups = () => {
        const compatibleVariations = getCompatibleVariations()

        // Primeiro, coletar TODOS os nomes de atributos na ordem em que aparecem
        const attributeOrder: string[] = []
        const attributeGroups = new Map<string, Set<string>>()

        // Iterar por TODAS as variações válidas (não apenas compatíveis) para manter ordem consistente
        validVariations.forEach(variation => {
            variation.attributeValues?.forEach(attr => {
                if (attr.attributeName && !attributeOrder.includes(attr.attributeName)) {
                    attributeOrder.push(attr.attributeName)
                }
            })
        })

        // Agora popular os valores apenas das variações compatíveis
        compatibleVariations.forEach(variation => {
            variation.attributeValues?.forEach(attr => {
                if (attr.attributeName && attr.value) {
                    if (!attributeGroups.has(attr.attributeName)) {
                        attributeGroups.set(attr.attributeName, new Set())
                    }
                    attributeGroups.get(attr.attributeName)?.add(attr.value)
                }
            })
        })

        // Retornar em ordem consistente
        const orderedGroups = new Map<string, Set<string>>()
        attributeOrder.forEach(attrName => {
            if (attributeGroups.has(attrName)) {
                orderedGroups.set(attrName, attributeGroups.get(attrName)!)
            }
        })

        return orderedGroups
    }

    const attributeGroups = getAvailableAttributeGroups()

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

    // Atualizar variação selecionada quando filtros mudarem
    useEffect(() => {
        if (selectedFilters.size === 0) return

        const matchingVariation = validVariations.find(variation => {
            return Array.from(selectedFilters.entries()).every(([attrName, value]) => {
                return variation.attributeValues?.some(
                    attr => attr.attributeName === attrName && attr.value === value
                )
            })
        })

        if (matchingVariation) {
            setSelectedVariation(matchingVariation.id)
        }
    }, [selectedFilters, validVariations])

    // Atualizar imagens quando a variação mudar
    useEffect(() => {
        if (currentVariation?.images && currentVariation.images.length > 0) {
            setDisplayedImages(currentVariation.images)
        } else {
            setDisplayedImages(product.images)
        }
        setCurrentImageIndex(0) // Resetar para primeira imagem
    }, [selectedVariation, currentVariation, product.images])

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? displayedImages.length - 1 : prev - 1
        )
    }

    const handleNextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === displayedImages.length - 1 ? 0 : prev + 1
        )
    }

    const handleThumbnailClick = (index: number) => {
        setCurrentImageIndex(index)
    }

    const handleAddToCart = () => {
        if (!currentVariation) return

        addItem({
            id: `${product.id}-${selectedVariation}`,
            productId: product.id,
            variationId: selectedVariation,
            name: t(`productNames.${product.slug}`, { defaultValue: product.name }),
            price: currentPrice,
            variationName: currentVariation.name,
            image: displayedImages[0] || product.images[0]
        })
        showToast(
            t('cart.addedToCart', { product: t(`productNames.${product.slug}`, { defaultValue: product.name }) }),
            'success'
        )
    }

    const handleBuyNow = () => {
        handleAddToCart()
        router.push('/carrinho')
    }

    const slugify = (s?: string) => {
        if (!s) return ''
        return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^\w\s-]/g, '')
            .trim().toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')
    }
    const categoryKey = slugify(product.category)

    return (
        <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-6 md:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Galeria de Imagens Melhorada */}
                <div className="w-full">
                    {/* Imagem Principal */}
                    <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 shadow-lg border-2 border-gray-200">
                        <Image
                            src={displayedImages[currentImageIndex] || '/file.svg'}
                            alt={`${product.name} - imagem ${currentImageIndex + 1}`}
                            fill
                            className="object-contain p-4"
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />

                        {/* Botões de Navegação - GRANDES e VISÍVEIS para idosos */}
                        {displayedImages.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-[#FED466] text-gray-800 rounded-full p-3 md:p-4 shadow-2xl transition-all duration-200 border-3 border-gray-300 hover:border-[#FD9555] hover:scale-110 z-10"
                                    aria-label="Imagem anterior"
                                >
                                    <ChevronLeft className="w-7 h-7 md:w-9 md:h-9" strokeWidth={3} />
                                </button>
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-[#FED466] text-gray-800 rounded-full p-3 md:p-4 shadow-2xl transition-all duration-200 border-3 border-gray-300 hover:border-[#FD9555] hover:scale-110 z-10"
                                    aria-label="Próxima imagem"
                                >
                                    <ChevronRight className="w-7 h-7 md:w-9 md:h-9" strokeWidth={3} />
                                </button>
                            </>
                        )}

                        {/* Indicador de posição */}
                        {displayedImages.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-base md:text-lg font-semibold">
                                {currentImageIndex + 1} / {displayedImages.length}
                            </div>
                        )}
                    </div>

                    {/* Miniaturas */}
                    {displayedImages.length > 1 && (
                        <div className="grid grid-cols-4 gap-3">
                            {displayedImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleThumbnailClick(idx)}
                                    aria-label={`Selecionar miniatura ${idx + 1}`}
                                    aria-current={currentImageIndex === idx ? true : undefined}
                                    className={cn(
                                        "relative aspect-square rounded-lg overflow-hidden border-3 transition-all duration-200 hover:scale-105",
                                        currentImageIndex === idx
                                            ? "border-[#FED466] ring-4 ring-[#FED466]/50 shadow-lg"
                                            : "border-gray-300 hover:border-[#FD9555] opacity-70 hover:opacity-100"
                                    )}
                                >
                                    <Image
                                        src={img}
                                        alt={`Miniatura ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 25vw, 12vw"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Informações do Produto */}
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary" className="text-base px-4 py-1.5">
                                {t(`productCategories.${categoryKey}`, { defaultValue: product.category })}
                            </Badge>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                                <span className="text-base text-gray-600 ml-2 font-medium">(4.8)</span>
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {t(`productNames.${product.slug}`, { defaultValue: product.name })}
                        </h1>

                        {product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-base px-3 py-1">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Seleção de Variação - Sistema de Filtros Interativos */}
                    {validVariations.length > 1 && (
                        <Card className="border-2 border-[#FED466] bg-gradient-to-br from-white via-[#FFFBEA]/10 to-white shadow-lg">
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between pb-4 border-b-2 border-[#FED466]/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FED466] to-[#FD9555] flex items-center justify-center shadow-md">
                                                <svg className="w-5 h-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">
                                                    {t('productInfo.chooseVariation')}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {t('productInfo.selectOptions')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2 bg-[#FED466]/20 px-4 py-2 rounded-full border border-[#FED466]/50">
                                            <div className="w-2 h-2 bg-[#FD9555] rounded-full animate-pulse"></div>
                                            <span className="text-sm font-semibold text-gray-700">
                                                {getCompatibleVariations().length} {getCompatibleVariations().length === 1 ? t('productInfo.optionAvailable') : t('productInfo.optionsAvailable')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Sistema de Filtros por Atributo */}
                                    <div className="space-y-5">
                                        {/* Filtros por Atributo */}
                                        {Array.from(attributeGroups.entries()).map(([attrName, values]) => (
                                            <div key={attrName} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-5 bg-gradient-to-b from-[#FD9555] to-[#FED466] rounded-full"></div>
                                                    <label className="font-bold text-base text-gray-800">
                                                        {attrName}
                                                    </label>
                                                    {selectedFilters.has(attrName) && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                                            {t('productInfo.selected')}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                    {Array.from(values).map(value => {
                                                        const isSelected = selectedFilters.get(attrName) === value

                                                        return (
                                                            <button
                                                                key={value}
                                                                onClick={() => handleFilterClick(attrName, value)}
                                                                aria-label={`Selecionar ${attrName} ${value}`}
                                                                className={cn(
                                                                    "group relative p-3 rounded-lg border-2 transition-all duration-200 text-center overflow-hidden text-sm",
                                                                    isSelected
                                                                        ? "border-[#FD9555] bg-gradient-to-br from-[#FED466] via-[#FED466]/80 to-[#FD9555]/20 shadow-md scale-105"
                                                                        : "border-gray-300 bg-white hover:border-[#FED466] hover:shadow-sm"
                                                                )}
                                                            >
                                                                {/* Efeito de brilho quando selecionado */}
                                                                {isSelected && (
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                                )}

                                                                {/* Check icon quando selecionado */}
                                                                {isSelected && (
                                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FD9555] rounded-full flex items-center justify-center shadow-sm z-10">
                                                                        <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path d="M5 13l4 4L19 7"></path>
                                                                        </svg>
                                                                    </div>
                                                                )}

                                                                <div className="relative">
                                                                    <div className={cn(
                                                                        "font-bold text-base mb-1 transition-colors",
                                                                        isSelected ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
                                                                    )}>
                                                                        {value}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "text-xs font-medium transition-colors",
                                                                        isSelected ? "text-[#FD9555]" : "text-gray-500"
                                                                    )}>
                                                                        {isSelected ? t('productInfo.selected').replace('✓ ', '') : t('productInfo.select')}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Resumo da Seleção */}
                                        {selectedFilters.size > 0 && currentVariation && (
                                            <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                                        <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-lg text-gray-900 mb-2">
                                                            {t('productInfo.productSelected')}
                                                        </h4>
                                                        <div className="space-y-2">
                                                            <div className="font-semibold text-xl text-gray-900">
                                                                {currentVariation.name}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Array.from(selectedFilters.entries()).map(([attr, value]) => (
                                                                    <span
                                                                        key={attr}
                                                                        className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-green-300 text-sm font-medium text-gray-700"
                                                                    >
                                                                        <span className="text-green-600">●</span>
                                                                        {attr}: <strong>{value}</strong>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-3 pt-2 mt-2 border-t border-green-200">
                                                                <span className="text-sm text-gray-600">{t('productInfo.price')}:</span>
                                                                <span className="text-2xl font-black text-[#FD9555]">
                                                                    R$ {currentVariation.price.toFixed(2).replace('.', ',')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Alerta quando houver seleção parcial */}
                                        {selectedFilters.size > 0 && !currentVariation && (
                                            <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                                        <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg text-gray-900 mb-2">
                                                            {t('productInfo.continueSelecting')}
                                                        </h4>
                                                        <p className="text-sm text-gray-700">
                                                            {t('productInfo.selectAllOptions')}
                                                            <br />
                                                            <strong className="text-amber-700">
                                                                {attributeGroups.size - selectedFilters.size} {t('productInfo.optionsRemaining')}
                                                            </strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Mensagem quando nenhuma seleção */}
                                        {selectedFilters.size === 0 && (
                                            <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                                                    </svg>
                                                </div>
                                                <p className="text-gray-600 font-medium">
                                                    {t('productInfo.selectAboveOptions')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Preço e Botões - GRANDES para idosos */}
                    <div className="space-y-5">
                        <div className="text-5xl md:text-6xl font-extrabold text-[#FD9555] drop-shadow-lg">
                            R$ {currentPrice.toFixed(2).replace('.', ',')}
                        </div>
                        <div className="flex flex-col gap-3">
                                                        <Button
                                                            onClick={handleBuyNow}
                                                            variant="default"
                                                            size="default"
                                                            className="w-full min-h-[48px] md:min-h-[56px] text-black font-bold text-base md:text-lg rounded-md border-2 border-[#FD9555] shadow-lg"
                                                        >
                                                            {t('product.buyNow', 'COMPRAR AGORA')}
                                                        </Button>
                                                        <Button
                                                            onClick={handleAddToCart}
                                                            variant="outline"
                                                            size="default"
                                                            className="w-full min-h-[48px] md:min-h-[56px] text-black font-bold text-base md:text-lg rounded-md shadow-md"
                                                        >
                                                            <ShoppingCart className="w-5 h-5 mr-2" />
                                                            {t('product.addToCart', 'ADICIONAR AO CARRINHO')}
                                                        </Button>
                        </div>
                    </div>

                    {/* Garantias */}
                    <Card className="border-2 border-amber-200 bg-amber-50">
                        <CardContent className="p-5 text-sm leading-relaxed text-gray-800">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-foreground">Descrição</h4>

                            <div className="mb-3">
                                <div className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <div>
                                        <strong>Você pode:</strong> Imprimir em casa ou em gráficas quantas vezes quiser, entregar o arquivo montado para presentear ou para uso próprio.
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="flex items-start gap-2">
                                    <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <div>
                                        <strong>Você NÃO pode:</strong> Fazer alterações de cor, molde, arte, frases (salvo para a opção &quot;escreva sua mensagem&quot;), trocas, empréstimos, doações, revendas ou qualquer tipo de comercialização, seja o PDF ou impresso, mesmo se tiver montado.
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-gray-700">
                                <p className="mb-2">Esse arquivo é protegido pela LEI Nº 9.610, DE 19 DE FEVEREIRO DE 1998. O crime de violação de direito autoral está previsto no art. 184 do Código Penal, que preceitua: “Violar direitos de autor e os que lhe são conexos: Pena – detenção, de 3 meses a 1 ano, ou multa”.</p>
                                <p className="mb-2">Arquivo exclusivo DIGITAL para IMPRESSÃO feito somente para USO PESSOAL. Necessário fazer download e salvar no google drive. Após a confirmação de pagamento, o arquivo ficará disponível para Download no email cadastrado na hora da compra ou aqui mesmo no site: (Área do cliente &gt; Downloads)</p>
                                <p>Esse arquivo é protegido pela LEI N° 9.610, DE 19 DE FEVEREIRO DE 1998. AUTORIZADO APENAS PARA USO PESSOAL. Enviar o arquivo para outras pessoas por email, whatsapp ou qualquer outro meio eletrônico é PROIBIDO. A cópia desse arquivo ou impressão com fins comerciais também NÃO é autorizada.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="mt-12">
                <Tabs defaultValue="description" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-14 text-lg">
                        <TabsTrigger value="description" className="text-lg font-semibold">
                            {t('product.tabs.description', 'Descrição')}
                        </TabsTrigger>
                        <TabsTrigger value="specifications" className="text-lg font-semibold">
                            {t('product.tabs.specifications', 'Especificações')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="description" className="mt-6">
                        <Card>
                            <CardContent className="p-6 md:p-8">
                                <div
                                    className="prose prose-lg max-w-none text-gray-800"
                                    dangerouslySetInnerHTML={{
                                        __html: t(`productDescriptions.${product.slug}`, {
                                            defaultValue: product.longDescription
                                        })
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="specifications" className="mt-6">
                        <Card>
                            <CardContent className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base md:text-lg">
                                    <div>
                                        <h4 className="font-bold mb-4 text-xl text-gray-900">
                                            {t('productInfo.generalInformation', 'Informações Gerais')}
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="font-medium text-gray-600">{t('productInfo.categoryLabel', 'Categoria:')}</span>
                                                <span className="font-semibold text-gray-900">
                                                    {t(`productCategories.${categoryKey}`, { defaultValue: product.category })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="font-medium text-gray-600">{t('productInfo.variationsLabel', 'Variações:')}</span>
                                                <span className="font-semibold text-gray-900">{validVariations.length}</span>
                                            </div>
                                            {product.tags.length > 0 && (
                                                <div className="flex justify-between py-2 border-b border-gray-200">
                                                    <span className="font-medium text-gray-600">{t('productInfo.tagsLabel', 'Tags:')}</span>
                                                    <span className="font-semibold text-gray-900">{product.tags.join(', ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {currentVariation && (
                                        <div>
                                            <h4 className="font-bold mb-4 text-xl text-gray-900">
                                                {t('productInfo.selectedVariation', 'Variação Selecionada')}
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between py-2 border-b border-gray-200">
                                                    <span className="font-medium text-gray-600">{t('productInfo.fieldName', 'Nome:')}</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {t(`variationNames.${currentVariation.name}`, { defaultValue: currentVariation.name })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-gray-200">
                                                    <span className="font-medium text-gray-600">{t('productInfo.fieldSize', 'Tamanho:')}</span>
                                                    <span className="font-semibold text-gray-900">{currentVariation.fileSize}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-gray-200">
                                                    <span className="font-medium text-gray-600">{t('productInfo.fieldDownloads', 'Downloads:')}</span>
                                                    <span className="font-semibold text-gray-900">{currentVariation.downloadLimit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}
