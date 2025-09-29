
 'use client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useState } from 'react'
import { ProductGallery } from '@/components/ui/product-gallery'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ShoppingCart, Download, Star, FileText, Shield } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'

interface ProductVariation {
    id: string
    name: string
    price: number
    description: string
    downloadLimit: number
    fileSize: string
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

interface ProductDetailClientProps {
    product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
    const [selectedVariation, setSelectedVariation] = useState(
        Array.isArray(product.variations) && product.variations.length > 0 ? product.variations[0].id : ''
    )
    const router = useRouter()
    const { addItem } = useCart()
    const { showToast } = useToast()

    const currentVariation = Array.isArray(product.variations) ? product.variations.find(v => v.id === selectedVariation) : undefined
    const currentPrice = currentVariation?.price || product.basePrice

    const handleAddToCart = () => {
        if (!currentVariation) return

        addItem({
            id: `${product.id}-${selectedVariation}`,
            productId: product.id,
            variationId: selectedVariation,
            name: t(`productNames.${product.slug}`, { defaultValue: product.name }),
            price: currentPrice,
            variationName: currentVariation.name,
            image: product.images[0]
        })
        showToast(t('cart.addedToCart', { product: t(`productNames.${product.slug}`, { defaultValue: product.name }) }), 'success')
    }

    const handleBuyNow = () => {
        handleAddToCart()
        // Redirecionar para carrinho
        router.push('/carrinho')
    }

    const { t } = useTranslation('common')

    // NOTE: using require above because this is a client component and we already have react-i18next installed;
    // if you prefer import, we can refactor the file to use top-level import.

    return (
        <section className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-8 py-6 grid grid-cols-1 xl:grid-cols-2 gap-10 xl:gap-16">
            {/* Galeria de Imagens */}
            <div className="w-full max-w-lg mx-auto xl:mx-0">
                <ProductGallery images={product.images} alt={t(`productNames.${product.slug}`, { defaultValue: product.name })} />
            </div>

            {/* Informações do Produto */}
            <div className="flex flex-col gap-6 w-full max-w-xl mx-auto xl:mx-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{t(`productCategories.${product.category}`, product.category)}</Badge>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                        </div>
                    </div>

                            <h1 className="text-3xl font-bold text-gray-900">{t(`productNames.${product.slug}`, { defaultValue: product.name })}</h1>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {(Array.isArray(product.tags) ? product.tags : []).map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                </div>

                {/* Seleção de Variação */}
                {Array.isArray(product.variations) && product.variations.length > 1 && (
                    <Card className="border-2 border-primary/40 bg-[#FFFBEA] shadow-md">
                        <CardContent className="p-4">
                                <h3 className="font-semibold mb-3 text-primary flex items-center gap-2 text-lg">
                                <FileText className="w-5 h-5 text-primary" /> {t('productInfo.chooseVariation', 'Escolha uma variação:')}
                            </h3>
                            <Select value={selectedVariation} onValueChange={setSelectedVariation}>
                                    <SelectTrigger className="w-full bg-white border-2 border-primary/40 focus:border-primary shadow-sm rounded-lg text-base">
                                    <SelectValue placeholder={t('productInfo.selectVariationPlaceholder', 'Selecione uma variação')} />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-lg shadow-lg border border-primary/30 max-h-60 overflow-y-auto">
                                    {product.variations.map((variation) => (
                                        <SelectItem key={variation.id} value={variation.id} className="flex justify-between items-center px-3 py-2">
                                            <span className="font-medium text-gray-900 truncate">{variation.name}</span>
                                            <span className="font-bold text-primary ml-2 whitespace-nowrap">R$ {variation.price.toFixed(2).replace('.', ',')}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                                    {currentVariation && (
                                <div className="mt-4 p-3 rounded-lg bg-white/80 border border-primary/10 text-sm flex flex-col gap-1">
                                    <span className="font-semibold text-gray-900">{t(`variationNames.${currentVariation.name}`, { defaultValue: currentVariation.name })}</span>
                                    {currentVariation.description && <span className="text-gray-500">{currentVariation.description}</span>}
                                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Download className="w-3 h-3" />{currentVariation.downloadLimit} {t('productInfo.downloads', 'downloads')}</span>
                                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{currentVariation.fileSize}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Preço e Botões */}
                <div className="space-y-4">
                        <div className="text-3xl font-bold text-primary drop-shadow-sm">
                        R$ {(typeof currentPrice === 'number' && !isNaN(currentPrice) ? currentPrice : 0).toFixed(2).replace('.', ',')}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                            <Button
                            onClick={handleBuyNow}
                            className="flex-1 min-h-[52px] bg-primary hover:bg-secondary text-black font-semibold shadow-md rounded-lg border-2 border-primary focus:ring-2 focus:ring-primary/60 transition-all"
                            size="lg"
                        >
                                {t('product.buyNow', 'Comprar Agora')}
                        </Button>
                            <Button
                            onClick={handleAddToCart}
                            className="flex-1 min-h-[52px] bg-secondary hover:bg-primary text-black font-semibold shadow-md rounded-lg border-2 border-secondary focus:ring-2 focus:ring-secondary/60 transition-all"
                            size="lg"
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                                {t('product.addToCart', 'Adicionar ao Carrinho')}
                        </Button>
                    </div>
                </div>

                {/* Garantias */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-600" />
                                    <span>{t('productInfo.warranty', 'Garantia de 30 dias')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Download className="w-4 h-4 text-blue-600" />
                                <span>{t('productInfo.immediateDownload', 'Download imediato após pagamento')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-600" />
                                <span>{t('productInfo.supportIncluded', 'Suporte técnico incluso')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Descrição Detalhada */}
            <div className="xl:col-span-2 mt-10">
                <Tabs defaultValue="description" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="description">Descrição</TabsTrigger>
                        <TabsTrigger value="specifications">Especificações</TabsTrigger>
                        <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                    </TabsList>

                    <TabsContent value="description" className="mt-4">
                        <Card>
                            <CardContent className="p-6">
                                <div
                                    className="prose max-w-none text-gray-800"
                                    dangerouslySetInnerHTML={{ __html: product.longDescription }}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="specifications" className="mt-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                                <h4 className="font-semibold mb-2">{t('productInfo.generalInformation', 'Informações Gerais')}</h4>
                                        <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>{t('productInfo.categoryLabel', 'Categoria:')}</span>
                                                        <span>{t(`productCategories.${product.category}`, product.category)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>{t('productInfo.variationsLabel', 'Variações:')}</span>
                                                        <span>{Array.isArray(product.variations) ? product.variations.length : 0}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>{t('productInfo.tagsLabel', 'Tags:')}</span>
                                                        <span>{Array.isArray(product.tags) ? product.tags.join(', ') : ''}</span>
                                                    </div>
                                        </div>
                                    </div>
                                    {currentVariation && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Variação Selecionada</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Nome:</span>
                                                    <span>{currentVariation.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tamanho:</span>
                                                    <span>{currentVariation.fileSize}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Downloads:</span>
                                                    <span>{currentVariation.downloadLimit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="text-center text-gray-500">
                                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Sistema de avaliações em desenvolvimento</p>
                                    <p className="text-sm mt-2">Em breve você poderá ver e deixar avaliações!</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}