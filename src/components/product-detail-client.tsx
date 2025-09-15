'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Download, Star, FileText, Shield } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'

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
    const [selectedVariation, setSelectedVariation] = useState(product.variations[0]?.id || '')
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const { addItem } = useCart()

    const currentVariation = product.variations.find(v => v.id === selectedVariation)
    const currentPrice = currentVariation?.price || product.basePrice

    const handleAddToCart = () => {
        if (!currentVariation) return

        addItem({
            id: `${product.id}-${selectedVariation}`,
            productId: product.id,
            variationId: selectedVariation,
            name: product.name,
            price: currentPrice,
            variationName: currentVariation.name,
            image: product.images[0]
        })

        alert('Produto adicionado ao carrinho!')
    }

    const handleBuyNow = () => {
        handleAddToCart()
        // TODO: Redirecionar para checkout
        window.location.href = '/carrinho'
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Galeria de Imagens */}
            <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <Image
                        src={product.images[selectedImageIndex]}
                        alt={product.name}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover"
                    />
                </div>

                {product.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                        {product.images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedImageIndex(index)}
                                className={`aspect-square overflow-hidden rounded-md border-2 ${selectedImageIndex === index ? 'border-primary' : 'border-gray-200'
                                    }`}
                            >
                                <Image
                                    src={image}
                                    alt={`${product.name} - imagem ${index + 1}`}
                                    width={150}
                                    height={150}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Informações do Produto */}
            <div className="space-y-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{product.category}</Badge>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                    <p className="text-gray-600 mt-2">{product.description}</p>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {product.tags.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                </div>

                {/* Seleção de Variação */}
                {product.variations.length > 1 && (
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-3">Escolha uma opção:</h3>
                            <RadioGroup value={selectedVariation} onValueChange={setSelectedVariation}>
                                {product.variations.map((variation) => (
                                    <div key={variation.id} className="flex items-center space-x-2 p-3 border rounded-md">
                                        <RadioGroupItem value={variation.id} id={variation.id} />
                                        <Label htmlFor={variation.id} className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium">{variation.name}</div>
                                                    <div className="text-sm text-gray-600">{variation.description}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                                        <span className="flex items-center gap-1">
                                                            <Download className="w-3 h-3" />
                                                            {variation.downloadLimit} downloads
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            {variation.fileSize}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-primary">
                                                    R$ {variation.price.toFixed(2).replace('.', ',')}
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                    </Card>
                )}

                {/* Preço e Botões */}
                <div className="space-y-4">
                    <div className="text-3xl font-bold text-primary">
                        R$ {currentPrice.toFixed(2).replace('.', ',')}
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handleBuyNow}
                            className="w-full bg-primary hover:bg-secondary text-black font-medium"
                            size="lg"
                        >
                            Comprar Agora
                        </Button>

                        <Button
                            onClick={handleAddToCart}
                            variant="outline"
                            className="w-full"
                            size="lg"
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Adicionar ao Carrinho
                        </Button>
                    </div>
                </div>

                {/* Garantias */}
                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-600" />
                                <span>Garantia de 30 dias</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Download className="w-4 h-4 text-blue-600" />
                                <span>Download imediato após pagamento</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-600" />
                                <span>Suporte técnico incluso</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Descrição Detalhada */}
            <div className="lg:col-span-2">
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
                                    className="prose max-w-none"
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
                                        <h4 className="font-semibold mb-2">Informações Gerais</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Categoria:</span>
                                                <span>{product.category}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Variações:</span>
                                                <span>{product.variations.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Tags:</span>
                                                <span>{product.tags.join(', ')}</span>
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
        </div>
    )
}