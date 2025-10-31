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
import { AddToCartSheet } from '@/components/sections/AddToCartSheet'

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
    const { addItem, openCartSheet } = useCart()
    const { showToast } = useToast()
    const [showAddToCart, setShowAddToCart] = useState(false)

    // Estado para controle de imagens
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Filtrar apenas variações que têm relação (com attributeValues válidos ou arquivos)
    const validVariations = product.variations.filter((v: ProductVariation) => {
        const hasAttributes = v.attributeValues && v.attributeValues.length > 0
        const hasValidAttrs = hasAttributes && v.attributeValues!.some((attr: { value?: string | null }) => attr.value !== null)
        return hasValidAttrs || (v.images && v.images.length > 0)
    })

    // Ordenar variações por preço (menor -> maior) para exibição e seleção padrão
    const variationsByPrice = [...validVariations].sort((a, b) => a.price - b.price)
    const cheapestVariationId = variationsByPrice.length > 0 ? variationsByPrice[0].id : ''

    const [selectedVariation, setSelectedVariation] = useState<string>(cheapestVariationId || '')

    // Imagens iniciais: se o produto não tem imagens, use imagens das variações como fallback
    // Criar mapa de imagens para variações (para seleção automática ao clicar na thumbnail)
    const imageToVariationMap = new Map<string, ProductVariation>();
    validVariations.forEach((variation: ProductVariation) => {
        if (variation.images && variation.images.length > 0) {
            variation.images.forEach((img: string) => {
                imageToVariationMap.set(img, variation);
            });
        }
    });

    // Criar array de todas as imagens disponíveis (produto + variações)
    const allAvailableImages = [
        ...product.images,
        ...validVariations.flatMap((v: ProductVariation) => v.images || [])
    ].filter((img, index, self) => self.indexOf(img) === index); // Remove duplicatas

    // Estado para filtros de atributos (novo sistema de seleção)
    const [selectedFilters, setSelectedFilters] = useState<Map<string, string>>(new Map())

    const currentVariation = validVariations.find((v: ProductVariation) => v.id === selectedVariation)

    // Precalcular min/max de preços para exibir faixa quando nada estiver selecionado
    const prices = validVariations.map((v: ProductVariation) => v.price)
    const minPrice = prices.length > 0 ? Math.min(...prices) : product.basePrice
    const maxPrice = prices.length > 0 ? Math.max(...prices) : product.basePrice
    const formatPrice = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`



    // Filtrar variações compatíveis baseado nos filtros selecionados
    const getCompatibleVariations = () => {
        if (selectedFilters.size === 0) return validVariations

        return validVariations.filter((variation: ProductVariation) => {
            return Array.from(selectedFilters.entries()).every(([attrName, value]) => {
                return variation.attributeValues?.some((attr: { attributeName?: string | null, value?: string | null }) => attr.attributeName === attrName && attr.value === value)
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
        validVariations.forEach((variation: ProductVariation) => {
            variation.attributeValues?.forEach((attr: { attributeName?: string | null, value?: string | null }) => {
                if (attr.attributeName && !attributeOrder.includes(attr.attributeName)) {
                    attributeOrder.push(attr.attributeName)
                }
            })
        })

        // Agora popular os valores apenas das variações compatíveis
        compatibleVariations.forEach((variation: ProductVariation) => {
            variation.attributeValues?.forEach((attr: { attributeName?: string | null, value?: string | null }) => {
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

    // Calcular número total de opções para ativar modo compacto quando necessário
    const totalValuesCount = Array.from(attributeGroups.values()).reduce((acc, s) => acc + s.size, 0)
    const compactMode = totalValuesCount > 12 || validVariations.length > 10

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
        // Se não houver filtros, retornar à menor variação (menor preço)
        if (selectedFilters.size === 0) {
            setSelectedVariation(cheapestVariationId)
            return
        }

        const matchingVariation = validVariations.find((variation: ProductVariation) => {
            return Array.from(selectedFilters.entries()).every(([attrName, value]) => {
                return variation.attributeValues?.some((attr: { attributeName?: string | null, value?: string | null }) => attr.attributeName === attrName && attr.value === value)
            })
        })

        if (matchingVariation) {
            setSelectedVariation(matchingVariation.id)
        }
    }, [selectedFilters, validVariations, cheapestVariationId])

    // Atualizar imagens: por padrão mostramos as imagens do produto (não sobrescrever com a
    // variação automaticamente). Só trocamos para as imagens da variação quando houver filtros
    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => {
            const newIndex = prev === 0 ? allAvailableImages.length - 1 : prev - 1;

            // Selecionar variação automaticamente
            const newImage = allAvailableImages[newIndex];
            const matchedVariation = imageToVariationMap.get(newImage);

            if (matchedVariation) {
                console.log('⬅️ Seta anterior - Variação selecionada:', matchedVariation.name);
                const newFilters = new Map<string, string>();
                matchedVariation.attributeValues?.forEach((attr) => {
                    if (attr.attributeName && attr.value) {
                        newFilters.set(attr.attributeName, attr.value);
                    }
                });
                setSelectedFilters(newFilters);
                setSelectedVariation(matchedVariation.id);
            } else {
                console.log('⬅️ Seta anterior - Imagem do produto, limpando seleção');
                setSelectedFilters(new Map());
                setSelectedVariation('');
            }

            return newIndex;
        });
    }

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => {
            const newIndex = prev === allAvailableImages.length - 1 ? 0 : prev + 1;

            // Selecionar variação automaticamente
            const newImage = allAvailableImages[newIndex];
            const matchedVariation = imageToVariationMap.get(newImage);

            if (matchedVariation) {
                console.log('➡️ Seta próxima - Variação selecionada:', matchedVariation.name);
                const newFilters = new Map<string, string>();
                matchedVariation.attributeValues?.forEach((attr) => {
                    if (attr.attributeName && attr.value) {
                        newFilters.set(attr.attributeName, attr.value);
                    }
                });
                setSelectedFilters(newFilters);
                setSelectedVariation(matchedVariation.id);
            } else {
                console.log('➡️ Seta próxima - Imagem do produto, limpando seleção');
                setSelectedFilters(new Map());
                setSelectedVariation('');
            }

            return newIndex;
        });
    }

    const handleThumbnailClick = (index: number) => {
        setCurrentImageIndex(index)

        // Obter a imagem clicada
        const clickedImage = allAvailableImages[index];

        // Verificar se essa imagem pertence a uma variação específica
        const matchedVariation = imageToVariationMap.get(clickedImage);

        if (matchedVariation) {
            console.log('🖼️ Imagem da variação clicada:', {
                image: clickedImage,
                variation: matchedVariation.name,
                attributes: matchedVariation.attributeValues
            });

            // Selecionar automaticamente os atributos dessa variação
            const newFilters = new Map<string, string>();
            matchedVariation.attributeValues?.forEach((attr) => {
                if (attr.attributeName && attr.value) {
                    newFilters.set(attr.attributeName, attr.value);
                }
            });

            setSelectedFilters(newFilters);
            setSelectedVariation(matchedVariation.id);
        } else {
            // Se for imagem do produto (não de variação), limpar seleção
            console.log('🖼️ Imagem do produto clicada, limpando seleção');
            setSelectedFilters(new Map());
            setSelectedVariation('');
        }
    }

    const handleAddToCart = () => {
        const allAttributesSelected = attributeGroups && selectedFilters && attributeGroups.size === selectedFilters.size;
        if (!currentVariation || !allAttributesSelected) {
            showToast(t('productInfo.selectAllOptions', 'Selecione todas as opções antes de adicionar ao carrinho!'), 'error');
            return;
        }

        // Determinar a imagem: primeiro tenta variação, depois produto
        const variationImage = currentVariation.images && currentVariation.images.length > 0
            ? currentVariation.images[0]
            : null;
        const productImage = product.images && product.images.length > 0
            ? product.images[0]
            : '/file.svg';

        const finalImage = variationImage || productImage;

        console.log('🛒 Adicionando ao carrinho:', {
            variationId: currentVariation.id,
            variationName: currentVariation.name,
            variationImages: currentVariation.images,
            productImages: product.images,
            selectedImage: finalImage
        });

        // Adiciona o produto ao carrinho com as variações/atributos selecionados
        addItem({
            id: `${product.id}-${currentVariation.id}`,
            productId: product.id,
            variationId: currentVariation.id,
            name: product.name,
            price: currentVariation.price,
            variationName: currentVariation.name,
            image: finalImage,
            attributes: currentVariation.attributeValues?.map(attr => ({
                name: attr.attributeName || '',
                value: attr.value || ''
            })) || []
        });
        showToast(t('cart.added', 'Produto adicionado ao carrinho!'), 'success');
        openCartSheet();
    }

    const handleBuyNow = () => {
        const allAttributesSelected = attributeGroups && selectedFilters && attributeGroups.size === selectedFilters.size;
        if (!currentVariation || !allAttributesSelected) {
            showToast(t('productInfo.selectAllOptions', 'Selecione todas as opções antes de comprar!'), 'error');
            return;
        }

        // Determinar a imagem: primeiro tenta variação, depois produto
        const variationImage = currentVariation.images && currentVariation.images.length > 0
            ? currentVariation.images[0]
            : null;
        const productImage = product.images && product.images.length > 0
            ? product.images[0]
            : '/file.svg';

        // Adiciona o produto ao carrinho antes de redirecionar
        addItem({
            id: `${product.id}-${currentVariation.id}`,
            productId: product.id,
            variationId: currentVariation.id,
            name: product.name,
            price: currentVariation.price,
            variationName: currentVariation.name,
            image: variationImage || productImage,
            attributes: currentVariation.attributeValues?.map(attr => ({
                name: attr.attributeName || '',
                value: attr.value || ''
            })) || []
        });
        showToast(t('cart.added', 'Produto adicionado ao carrinho!'), 'success');
        openCartSheet();
        router.push('/carrinho');
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
                {/* Galeria de Imagens Melhorada (desktop only) */}
                <div className="w-full order-1 lg:order-1 hidden lg:block">
                    {/* Imagem Principal */}
                    <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 shadow-lg border-2 border-gray-200">
                        <Image
                            src={allAvailableImages[currentImageIndex] || '/file.svg'}
                            alt={`${product.name} - imagem ${currentImageIndex + 1}`}
                            fill
                            className="object-contain p-4"
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />

                        {/* Botões de Navegação - GRANDES e VISÍVEIS para idosos */}
                        {allAvailableImages.length > 1 && (
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
                        {allAvailableImages.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-sm md:text-base font-bold shadow-2xl backdrop-blur-sm">
                                {currentImageIndex + 1} / {allAvailableImages.length}
                            </div>
                        )}
                    </div>

                    {/* Miniaturas com Scroll Horizontal */}
                    {allAvailableImages.length > 1 && (
                        <div className="relative">
                            <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
                                {allAvailableImages.map((img, idx) => {
                                    const isVariationImage = imageToVariationMap.has(img);
                                    const isSelected = currentImageIndex === idx;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleThumbnailClick(idx)}
                                            aria-label={`Selecionar miniatura ${idx + 1}`}
                                            aria-current={isSelected ? true : undefined}
                                            className={cn(
                                                "relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-3 transition-all duration-200 hover:scale-105",
                                                isSelected
                                                    ? "border-[#FED466] ring-4 ring-[#FED466]/50 shadow-lg"
                                                    : "border-gray-300 hover:border-[#FD9555] opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Miniatura ${idx + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="96px"
                                            />
                                            {/* Indicador de variação */}
                                            {isVariationImage && (
                                                <div className="absolute bottom-1 right-1 w-3 h-3 bg-[#FD9555] rounded-full border-2 border-white shadow-sm"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}                    {/* Descrição e Especificações (desktop-only Tabs kept in gallery) */}
                    {/* For mobile we render a compact image + tabs below tags/rating inside the info column. */}

                    <div className="mt-8 w-full">
                        <Tabs defaultValue="description" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 text-base md:text-lg">
                                <TabsTrigger value="description" className="text-base md:text-lg font-semibold">
                                    {t('product.tabs.description', 'Descrição')}
                                </TabsTrigger>
                                <TabsTrigger value="specifications" className="text-base md:text-lg font-semibold">
                                    {t('product.tabs.specifications', 'Especificações')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="description" className="mt-4">
                                <Card>
                                    <CardContent className="p-4 md:p-6">
                                        <div
                                            className="prose prose-base max-w-none text-gray-800"
                                            dangerouslySetInnerHTML={{
                                                __html: t(`productDescriptions.${product.slug}`, {
                                                    defaultValue: product.longDescription
                                                })
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="specifications" className="mt-4">
                                <Card>
                                    <CardContent className="p-4 md:p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
                                            <div>
                                                <h4 className="font-bold mb-2 text-lg text-gray-900">{t('productInfo.generalInformation', 'Informações Gerais')}</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                                        <span className="font-medium text-gray-600">{t('productInfo.categoryLabel', 'Categoria:')}</span>
                                                        <span className="font-semibold text-gray-900">{t(`productCategories.${categoryKey}`, { defaultValue: product.category })}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                                        <span className="font-medium text-gray-600">{t('productInfo.variationsLabel', 'Variações:')}</span>
                                                        <span className="font-semibold text-gray-900">{validVariations.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {currentVariation && (
                                                <div>
                                                    <h4 className="font-bold mb-2 text-lg text-gray-900">{t('productInfo.selectedVariation', 'Variação Selecionada')}</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between py-2 border-b border-gray-200">
                                                            <span className="font-medium text-gray-600">{t('productInfo.fieldName', 'Nome:')}</span>
                                                            <span className="font-semibold text-gray-900">{t(`variationNames.${currentVariation.name}`, { defaultValue: currentVariation.name })}</span>
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

                </div>

                {/* Informações do Produto */}
                <div className="flex flex-col gap-6 order-2 lg:order-2">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary" className="text-sm md:text-base px-2 md:px-4 py-0.5 md:py-1.5">
                                {t(`productCategories.${categoryKey}`, { defaultValue: product.category })}
                            </Badge>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                                <span className="text-sm md:text-base text-gray-600 ml-2 font-medium">(4.8)</span>
                            </div>
                        </div>

                        {/* Mobile: main image & tabs (rendered here between tags/rating and name) */}
                        <div className="block lg:hidden mt-3 mb-4">
                            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md border border-gray-200">
                                <Image
                                    src={allAvailableImages[currentImageIndex] || '/file.svg'}
                                    alt={`${product.name} - imagem ${currentImageIndex + 1}`}
                                    fill
                                    className="object-contain p-4"
                                    sizes="100vw"
                                />

                                {/* Mobile prev/next controls */}
                                {allAvailableImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevImage}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#FED466] text-gray-800 rounded-full p-2 shadow-md transition-all duration-150 z-10"
                                            aria-label="Imagem anterior"
                                        >
                                            <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#FED466] text-gray-800 rounded-full p-2 shadow-md transition-all duration-150 z-10"
                                            aria-label="Próxima imagem"
                                        >
                                            <ChevronRight className="w-5 h-5" strokeWidth={3} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Mobile thumbnails */}
                            {allAvailableImages.length > 1 && (
                                <div className="mt-3 flex gap-2 overflow-x-auto">
                                    {allAvailableImages.map((img, idx) => {
                                        const isVariationImage = imageToVariationMap.has(img);
                                        const isSelected = currentImageIndex === idx;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleThumbnailClick(idx)}
                                                aria-label={`Selecionar imagem ${idx + 1}`}
                                                className={cn(
                                                    "relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border transition-all duration-150",
                                                    isSelected ? 'ring-2 ring-[#FED466] border-transparent' : 'border-gray-200'
                                                )}
                                            >
                                                <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" sizes="80px" />
                                                {/* Indicador de variação */}
                                                {isVariationImage && (
                                                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#FD9555] rounded-full border border-white shadow-sm"></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
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

                        {/* Preço - exibido acima da seleção */}
                        <div className="mt-4 mb-4">
                            <div className="text-4xl md:text-5xl font-extrabold text-[#FD9555]">
                                {selectedFilters.size === 0 ? (
                                    minPrice === maxPrice ? (
                                        formatPrice(minPrice)
                                    ) : (
                                        `${formatPrice(minPrice)} — ${formatPrice(maxPrice)}`
                                    )
                                ) : (
                                    currentVariation ? formatPrice(currentVariation.price) : formatPrice(product.basePrice)
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Seleção de Variação - Sistema de Filtros Interativos */}
                    {validVariations.length > 1 && (
                        <Card className="border-2 border-[#FED466] bg-gradient-to-br from-white via-[#FFFBEA]/10 to-white shadow-md">
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center justify-between pb-3 border-b-2 border-[#FED466]/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FED466] to-[#FD9555] flex items-center justify-center shadow-sm">
                                                <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">
                                                    {t('productInfo.chooseVariation')}
                                                </h3>
                                                <p className="text-xs text-gray-600">
                                                    {t('productInfo.selectOptions')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-2 bg-[#FED466]/20 px-3 py-1.5 rounded-full border border-[#FED466]/50">
                                            <div className="w-2 h-2 bg-[#FD9555] rounded-full animate-pulse"></div>
                                            <span className="text-sm font-semibold text-gray-700">
                                                {getCompatibleVariations().length} {getCompatibleVariations().length === 1 ? t('productInfo.optionAvailable') : t('productInfo.optionsAvailable')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Sistema de Filtros por Atributo */}
                                    <div className={cn("space-y-4", compactMode && "max-h-[240px] overflow-auto pr-2")}>
                                        {Array.from(attributeGroups.entries()).map(([attrName, values]) => (
                                            <div key={attrName} className={cn("space-y-2", compactMode && "py-1")}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-5 bg-gradient-to-b from-[#FD9555] to-[#FED466] rounded-full"></div>
                                                    <label className="font-semibold text-sm text-gray-800">
                                                        {attrName}
                                                    </label>
                                                    {selectedFilters.has(attrName) && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                                            {t('productInfo.selected')}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4", compactMode ? "gap-1 md:grid-cols-3" : "gap-2")}>
                                                    {Array.from(values).map(value => {
                                                        const isSelected = selectedFilters.get(attrName) === value
                                                        return (
                                                            <button
                                                                key={value}
                                                                onClick={() => handleFilterClick(attrName, value)}
                                                                aria-label={`Selecionar ${attrName} ${value}`}
                                                                className={cn(
                                                                    compactMode ? "group relative p-1.5 rounded-md border-2 transition-all duration-200 text-center overflow-hidden text-xs cursor-pointer" : "group relative p-2 rounded-md border-2 transition-all duration-200 text-center overflow-hidden text-sm cursor-pointer",
                                                                    isSelected
                                                                        ? "border-[#FD9555] bg-gradient-to-br from-[#FED466] via-[#FED466]/80 to-[#FD9555]/20 shadow-sm scale-105"
                                                                        : "border-gray-300 bg-white hover:border-[#FED466] hover:shadow-sm"
                                                                )}
                                                            >
                                                                {isSelected && (
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                                                )}

                                                                {isSelected && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FD9555] rounded-full flex items-center justify-center shadow-sm z-10">
                                                                        <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path d="M5 13l4 4L19 7"></path>
                                                                        </svg>
                                                                    </div>
                                                                )}

                                                                <div className="relative">
                                                                    <div className={cn(
                                                                        "font-semibold text-sm mb-1 transition-colors",
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

                                        {/* Alerta quando houver seleção parcial */}
                                        {selectedFilters.size > 0 && !currentVariation && (
                                            <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        <svg className="w-5 h-5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-base text-gray-900 mb-1">
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

                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* CTAs - abaixo da seleção (Comprar / Adicionar ao carrinho) */}
                    <div className="mt-4 mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2">
                            <Button
                                onClick={handleBuyNow}
                                variant="default"
                                size="default"
                                className="w-full sm:w-auto min-h-[44px] md:min-h-[48px] text-black font-bold text-sm md:text-base rounded-md border-2 border-[#FD9555] shadow-md cursor-pointer bg-[#FED466] hover:bg-[#FD9555] uppercase"
                            >
                                {t('product.buyNow', 'COMPRAR AGORA')}
                            </Button>
                            <Button
                                onClick={handleAddToCart}
                                variant="default"
                                size="default"
                                className="w-full sm:w-auto min-h-[44px] md:min-h-[48px] text-white font-bold text-sm md:text-base rounded-md shadow-sm cursor-pointer bg-[#FD9555] hover:bg-[#E64D2B] border-2 border-[#FD9555]"
                            >
                                <ShoppingCart className="w-5 h-5 mr-2 text-white" />
                                {t('product.addToCart', 'ADICIONAR AO CARRINHO')}
                            </Button>
                        </div>
                    </div>

                    {/* Garantias / Descrição legal compacta */}
                    <Card className="border-2 border-amber-200 bg-amber-50">
                        <CardContent className="p-4 text-sm leading-relaxed text-gray-800">
                            <h4 className="font-bold mb-4 flex justify-center items-center gap-2 text-xl">Descrição</h4>

                            <div className="mb-2">
                                <div className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <div>
                                        <strong>Você pode:</strong> Imprimir em casa ou em gráficas quantas vezes quiser, entregar o arquivo montado para presentear ou para uso próprio.
                                    </div>
                                </div>
                            </div>

                            <div className="mb-2">
                                <div className="flex items-start gap-2">
                                    <X className="w-4 h-4 text-red-600 flex-shrink-0" />
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

                    {/* Mobile Tabs: descrição / specs - apenas mobile */}
                    <div className="mt-4 lg:hidden">
                        <Tabs defaultValue="description" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-10 text-sm">
                                <TabsTrigger value="description" className="text-sm font-semibold">
                                    {t('product.tabs.description', 'Descrição')}
                                </TabsTrigger>
                                <TabsTrigger value="specifications" className="text-sm font-semibold">
                                    {t('product.tabs.specifications', 'Especificações')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="description" className="mt-3">
                                <Card>
                                    <CardContent className="p-3">
                                        <div
                                            className="prose prose-sm max-w-none text-gray-800"
                                            dangerouslySetInnerHTML={{
                                                __html: t(`productDescriptions.${product.slug}`, {
                                                    defaultValue: product.longDescription
                                                })
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="specifications" className="mt-3">
                                <Card>
                                    <CardContent className="p-3">
                                        <div className="grid grid-cols-1 gap-3 text-sm">
                                            <div>
                                                <h4 className="font-bold mb-2 text-base text-gray-900">{t('productInfo.generalInformation', 'Informações Gerais')}</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                                        <span className="font-medium text-gray-600">{t('productInfo.categoryLabel', 'Categoria:')}</span>
                                                        <span className="font-semibold text-gray-900">{t(`productCategories.${categoryKey}`, { defaultValue: product.category })}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                                        <span className="font-medium text-gray-600">{t('productInfo.variationsLabel', 'Variações:')}</span>
                                                        <span className="font-semibold text-gray-900">{validVariations.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {currentVariation && (
                                                <div>
                                                    <h4 className="font-bold mb-2 text-base text-gray-900">{t('productInfo.selectedVariation', 'Variação Selecionada')}</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between py-2 border-b border-gray-200">
                                                            <span className="font-medium text-gray-600">{t('productInfo.fieldName', 'Nome:')}</span>
                                                            <span className="font-semibold text-gray-900">{t(`variationNames.${currentVariation.name}`, { defaultValue: currentVariation.name })}</span>
                                                        </div>
                                                        <div className="flex justify-between py-2 border-b border-gray-200">
                                                            <span className="font-medium text-gray-600">{t('productInfo.fieldSize', 'Tamanho:')}</span>
                                                            <span className="font-semibold text-gray-900">{currentVariation.fileSize}</span>
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

                </div>
            </div>
            {/* Sheet de adicionar ao carrinho */}
            <AddToCartSheet
                open={showAddToCart}
                onOpenChange={setShowAddToCart}
                product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.basePrice,
                    mainImage: product.images && product.images.length > 0 ? { data: product.images[0], alt: product.name } : null,
                    variations: product.variations.map(v => ({
                        id: v.id,
                        name: v.name,
                        slug: v.name ? v.name.toLowerCase().replace(/\s+/g, '-') : '',
                        price: v.price,
                        isActive: true,
                        sortOrder: 0,
                        attributeValues: v.attributeValues?.map(attr => ({
                            attributeId: attr.attributeId,
                            attributeName: attr.attributeName || '',
                            valueId: attr.valueId,
                            value: attr.value || ''
                        })) || []
                    }))
                }}
                onAddedToCart={() => {
                    setShowAddToCart(false);
                    openCartSheet();
                }}
            />
        </section>
    )
}
