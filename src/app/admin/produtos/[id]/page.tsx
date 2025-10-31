'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Loader2, Package, DollarSign, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import EditProductDialog from '@/components/admin/EditProductDialog'

interface ProductData {
    id: string
    name: string
    slug: string
    description?: string
    shortDescription?: string
    price: number
    categoryId?: string
    isActive: boolean
    isFeatured: boolean
    seoTitle?: string
    seoDescription?: string
    images?: Array<{
        id: string
        cloudinaryId?: string
        url?: string
        alt?: string
    }>
    variations?: Array<{
        id: string
        name: string
        slug: string
        price: number
        isActive: boolean
        files?: Array<{
            filename: string
            originalName: string
            fileSize: number
            mimeType: string
            r2Key: string
        }>
        images?: Array<{
            id: string
            cloudinaryId?: string
            url?: string
            alt?: string
        }>
        attributeValues?: Array<{
            attributeId: string
            valueId: string
        }>
    }>
    files?: Array<{
        filename: string
        originalName: string
        fileSize: number
        mimeType: string
        r2Key: string
    }>
    attributes?: Array<{
        attributeId: string
        valueIds: string[]
    }>
}

export default function ProductViewPage() {
    const params = useParams()
    const router = useRouter()
    const productId = params?.id as string

    const [product, setProduct] = useState<ProductData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const fetchProduct = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/admin/products/${productId}`)

            if (!response.ok) {
                throw new Error('Produto não encontrado')
            }

            const data = await response.json()
            // Converter preços de string para number
            data.price = parseFloat(data.price || '0')
            if (data.variations) {
                data.variations = data.variations.map((v: typeof data.variations[0]) => ({
                    ...v,
                    price: parseFloat(v.price || '0')
                }))
            }
            setProduct(data)
        } catch (err) {
            console.error('Erro ao carregar produto:', err)
            setError(err instanceof Error ? err.message : 'Erro ao carregar produto')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (productId) {
            fetchProduct()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <AlertDescription>
                        {error || 'Produto não encontrado'}
                    </AlertDescription>
                </Alert>
                <Button
                    onClick={() => router.push('/admin/produtos')}
                    variant="outline"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => router.push('/admin/produtos')}
                        variant="outline"
                        size="sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <div className="p-3 bg-gradient-to-br from-[#FED466] to-[#FD9555] rounded-xl shadow-sm">
                        <Package className="w-7 h-7 text-gray-800" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                        <p className="text-gray-600 mt-1">ID: {product.id.slice(0, 8)}...</p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsEditDialogOpen(true)}
                    className="bg-[#FED466] hover:bg-[#FD9555] text-gray-800 font-medium shadow-sm"
                >
                    Editar Produto
                </Button>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-[#FD9555]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Preço Base</p>
                                <p className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Status</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`h-3 w-3 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className="text-lg font-semibold">
                                        {product.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                {product.isFeatured && (
                                    <p className="text-sm text-gray-500 mt-1">⭐ Produto em destaque</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Variações</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {product.variations?.length || 0}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {(product.variations?.length || 0) > 0 ? 'cadastradas' : 'Sem variações'}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Descrições */}
            {(product.shortDescription || product.description) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Descrições</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {product.shortDescription && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição Curta</h3>
                                <p className="text-gray-600">{product.shortDescription}</p>
                            </div>
                        )}
                        {product.description && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição Completa</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Imagens do Produto */}
            {product.images && product.images.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Imagens do Produto ({product.images.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {product.images.map((image, idx) => (
                                <div key={image.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                                    {image.url ? (
                                        <Image
                                            src={image.url}
                                            alt={image.alt || `Imagem ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            Sem imagem
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Variações */}
            {product.variations && product.variations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Variações ({product.variations.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {product.variations.map((variation) => (
                                <div key={variation.id} className="border rounded-lg p-4 hover:border-[#FED466] transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{variation.name}</h3>
                                            <p className="text-sm text-gray-500">Slug: {variation.slug}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-[#FD9555]">{formatPrice(variation.price)}</p>
                                            <span className={`text-xs px-2 py-1 rounded ${variation.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {variation.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Imagens da Variação */}
                                    {variation.images && variation.images.length > 0 && (
                                        <div className="mb-3">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Imagens ({variation.images.length})</h4>
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                {variation.images.map((img, idx) => (
                                                    <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden border">
                                                        {img.url ? (
                                                            <Image
                                                                src={img.url}
                                                                alt={img.alt || ''}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-xs text-gray-400">Sem img</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Arquivos da Variação */}
                                    {variation.files && variation.files.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Arquivos PDF ({variation.files.length})</h4>
                                            <div className="space-y-2">
                                                {variation.files.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">{file.originalName}</p>
                                                            <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                                                        </div>
                                                        <div className="text-xs text-gray-400 ml-2">
                                                            {file.mimeType}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Arquivos do Produto (sem variações) */}
            {product.files && product.files.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Arquivos PDF ({product.files.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {product.files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{file.originalName}</p>
                                        <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
                                    </div>
                                    <div className="text-sm text-gray-400 ml-2">
                                        {file.mimeType}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* SEO */}
            {(product.seoTitle || product.seoDescription) && (
                <Card>
                    <CardHeader>
                        <CardTitle>SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {product.seoTitle && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Título SEO</h3>
                                <p className="text-gray-600">{product.seoTitle}</p>
                            </div>
                        )}
                        {product.seoDescription && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Descrição SEO</h3>
                                <p className="text-gray-600">{product.seoDescription}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Dialog de Edição */}
            {product && (
                <EditProductDialog
                    product={product}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onSuccess={fetchProduct}
                />
            )}
        </div>
    )
}
