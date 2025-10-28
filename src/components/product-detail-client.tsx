
'use client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useState, useEffect } from 'react'
import { ProductGallery } from '@/components/ui/product-gallery'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ShoppingCart, Download, Star, FileText, Check, X } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

interface ProductVariation {
    id: string
    name: string
    price: number
    description: string
    downloadLimit: number
    fileSize: string
    attributeValues?: { attributeId: string; attributeName?: string | null; valueId: string; value?: string | null }[]
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
    // If product has attribute values on variations, build selectors state
    const hasAttributeSelectors = Array.isArray(product.variations) && product.variations.some(v => Array.isArray(v.attributeValues) && v.attributeValues!.length > 0)

    // Build available attributes from variations
    const buildAttributes = () => {
        if (!hasAttributeSelectors) return [] as { attributeId: string; attributeName?: string | null; options: { valueId: string; value?: string | null }[] }[]

        const map: Record<string, { attributeName?: string | null; options: Record<string, string | null> }> = {}
        product.variations.forEach(v => {
            const av = v.attributeValues || []
            av.forEach(a => {
                if (!map[a.attributeId]) map[a.attributeId] = { attributeName: a.attributeName, options: {} }
                map[a.attributeId].options[a.valueId] = a.value ?? null
            })
        })

        return Object.keys(map).map(k => ({ attributeId: k, attributeName: map[k].attributeName, options: Object.keys(map[k].options).map(vid => ({ valueId: vid, value: map[k].options[vid] })) }))
    }

    const availableAttributes = buildAttributes()

    const initialSelectedAttrs: Record<string, string> = {}
    availableAttributes.forEach(attr => {
        if (attr.options.length > 0) initialSelectedAttrs[attr.attributeId] = attr.options[0].valueId
    })

    const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(initialSelectedAttrs)

    const [selectedVariation, setSelectedVariation] = useState(
        Array.isArray(product.variations) && product.variations.length > 0 ? product.variations[0].id : ''
    )
    const router = useRouter()
    const { addItem } = useCart()
    const { showToast } = useToast()

    const currentVariation = Array.isArray(product.variations) ? product.variations.find(v => v.id === selectedVariation) : undefined
    const currentPrice = currentVariation?.price || product.basePrice

    // Normalize category to a slug key for i18n lookups. Backend may return a human name (e.g. "Adesivos")
    // so we slugify it to match keys like productCategories.adesivos
    const slugify = (s?: string) => {
        if (!s) return ''
        return s
            .toString()
            .normalize('NFD') // decompose accents
            .replace(/\p{Diacritic}/gu, '') // remove diacritics
            .replace(/[^\w\s-]/g, '') // remove non-word chars
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
    }
    const categoryKey = slugify(product.category)

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

    // Resolve variation by selected attributes (if applicable)
    useEffect(() => {
        if (!hasAttributeSelectors) return
        // find variation matching all selectedAttrs
        const found = product.variations.find(v => {
            const av = v.attributeValues || []
            return Object.entries(selectedAttrs).every(([attrId, valId]) => av.some(x => x.attributeId === attrId && x.valueId === valId))
        })
        if (found) setSelectedVariation(found.id)
    }, [selectedAttrs, hasAttributeSelectors, product.variations])

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
                        <Badge variant="secondary">{t(`productCategories.${categoryKey}`, { defaultValue: product.category })}</Badge>
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
                            <h3 className="font-semibold mb-2 text-primary flex items-center gap-2 text-base">
                                <FileText className="w-4 h-4 text-primary" /> {t('productInfo.chooseVariation', 'Escolha uma variação:')}
                            </h3>
                            {/* Attribute selectors (if any) */}
                            {availableAttributes.length > 0 && (
                                <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {availableAttributes.map(attr => (
                                        <div key={attr.attributeId}>
                                            <Label className="text-sm">{attr.attributeName || attr.attributeId}</Label>
                                            <Select value={selectedAttrs[attr.attributeId] || ''} onValueChange={(val) => setSelectedAttrs(prev => ({ ...prev, [attr.attributeId]: val }))}>
                                                <SelectTrigger className="w-full bg-white border-2 border-primary/40 focus:border-primary shadow-sm rounded-md text-sm">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {attr.options.map(opt => (
                                                        <SelectItem key={opt.valueId} value={opt.valueId}>{opt.value || opt.valueId}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Select value={selectedVariation} onValueChange={setSelectedVariation}>
                                <SelectTrigger className="w-full bg-white border-2 border-primary/40 focus:border-primary shadow-sm rounded-md text-sm">
                                    <SelectValue placeholder={t('productInfo.selectVariationPlaceholder', 'Selecione uma variação')} />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-lg shadow-lg border border-primary/30 max-h-60 overflow-y-auto">
                                    {product.variations.map((variation) => (
                                        <SelectItem key={variation.id} value={variation.id} className="flex justify-between items-center px-3 py-2">
                                            <span className="font-medium text-gray-900 truncate">{t(`variationNames.${variation.name}`, { defaultValue: variation.name })}</span>
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
                            className="flex-1 bg-primary hover:bg-secondary text-black font-semibold shadow-sm rounded-md border-2 border-primary focus:ring-2 focus:ring-primary/60 transition-all text-sm"
                            size="default"
                        >
                            {t('product.buyNow', 'Comprar Agora')}
                        </Button>
                        <Button
                            onClick={handleAddToCart}
                            className="flex-1 bg-secondary hover:bg-primary text-black font-semibold shadow-sm rounded-md border-2 border-secondary focus:ring-2 focus:ring-secondary/60 transition-all text-sm"
                            size="default"
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {t('product.addToCart', 'Adicionar ao Carrinho')}
                        </Button>
                    </div>
                </div>

                {/* Legal / Copyright Alert (applies to all products) */}
                <Card className="border-2 border-amber-200 bg-amber-50">
                    <CardContent className="p-4 text-sm leading-relaxed text-gray-800">
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

            {/* Descrição Detalhada */}
            <div className="xl:col-span-2 mt-10">
                <Tabs defaultValue="description" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="description">{t('product.tabs.description', 'Descrição')}</TabsTrigger>
                        <TabsTrigger value="specifications">{t('product.tabs.specifications', 'Especificações')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="description" className="mt-4">
                        <Card>
                            <CardContent className="p-6">
                                {/** Use translation for product long description when available; fallback to DB value. */}
                                {(() => {
                                    const key = `productDescriptions.${product.slug}`
                                    const langsToTry = [i18n.language, 'pt', 'en', 'es']
                                    for (const lng of langsToTry) {
                                        if (!lng) continue
                                        if (i18n.exists(key, { lng })) {
                                            const res = i18n.getResource(lng, 'common', `productDescriptions.${product.slug}`) || i18n.t(key, { lng })
                                            return (
                                                <div
                                                    className="prose max-w-none text-gray-800"
                                                    dangerouslySetInnerHTML={{ __html: String(res) }}
                                                />
                                            )
                                        }
                                    }

                                    // If no translation resource exists in any language, fall back to DB HTML
                                    if (process.env.NODE_ENV !== 'production') {
                                        console.debug(`i18n: no translation found for ${key} in languages ${langsToTry.join(', ')}`)
                                    }
                                    return (
                                        <div
                                            className="prose max-w-none text-gray-800"
                                            dangerouslySetInnerHTML={{ __html: product.longDescription }}
                                        />
                                    )
                                })()}
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
                                                <span>{t(`productCategories.${categoryKey}`, { defaultValue: product.category })}</span>
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
                                            <h4 className="font-semibold mb-2">{t('productInfo.selectedVariation', 'Variação Selecionada')}</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>{t('productInfo.fieldName', 'Nome:')}</span>
                                                    <span>{t(`variationNames.${currentVariation.name}`, { defaultValue: currentVariation.name })}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{t('productInfo.fieldSize', 'Tamanho:')}</span>
                                                    <span>{currentVariation.fileSize}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{t('productInfo.fieldDownloads', 'Downloads:')}</span>
                                                    <span>{currentVariation.downloadLimit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Reviews tab intentionally removed (no reviews feature) */}
                </Tabs>
            </div>
        </section>
    )
}