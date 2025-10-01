'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    Eye,
    Trash2,
    FileText,
    Loader2,
    Package,
    Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import EditProductDialog from '@/components/admin/EditProductDialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface FileData {
    id: string
    originalName: string
    size: number
    mimeType: string
    cloudflareId?: string
}

interface ImageData {
    id: string
    data?: string
    mimeType?: string
    alt?: string
}

interface VariationData {
    id: string
    productId: string
    name: string
    slug: string
    price: number
    isActive: boolean
    files?: FileData[]
    images?: ImageData[]
}

interface ProductData {
    id: string
    name: string
    slug: string
    price: number
    isActive: boolean
    isFeatured: boolean
    categoryId?: string
    files?: FileData[]
    variations?: VariationData[]
    images?: ImageData[]
}

interface ProductsTableProps {
    search?: string
    category?: string
    page?: number
    onRefresh?: () => void
}

export default function ProductsCardsView({
    search = '',
    category = '',
    page = 1,
    onRefresh
}: ProductsTableProps) {
    const [products, setProducts] = useState<ProductData[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingProduct, setDeletingProduct] = useState<string | null>(null)
    const [editingProduct, setEditingProduct] = useState<ProductData | null>(null)
    const [cardsError, setCardsError] = useState<string | null>(null)

    // Fetch products from API
    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true)
                const params = new URLSearchParams()
                if (search) params.append('search', search)
                if (category) params.append('category', category)
                if (page > 1) params.append('page', page.toString())
                params.append('include', 'variations,files')

                const queryString = params.toString()
                const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`

                const response = await fetch(url)
                if (!response.ok) {
                    throw new Error('Erro ao buscar produtos')
                }
                const data = await response.json()
                setProducts(data.products || data)
            } catch (error) {
                console.error('Erro ao buscar produtos:', error)
                setProducts([])
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [search, category, page])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const refreshProducts = async () => {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (category) params.append('category', category)
        if (page > 1) params.append('page', page.toString())
        params.append('include', 'variations,files')

        const queryString = params.toString()
        const url = `/api/admin/products${queryString ? `?${queryString}` : ''}`

        try {
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setProducts(data.products || data)
            }
        } catch (error) {
            console.error('Erro ao atualizar produtos:', error)
        }
    }

    const handleDelete = async (productId: string) => {
        try {
            setDeletingProduct(productId)
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Erro ao excluir produto')
            }

            await refreshProducts()
            onRefresh?.()
        } catch (error) {
            console.error('Erro ao excluir produto:', error)
            setCardsError('Erro ao excluir produto. Tente novamente.')
        } finally {
            setDeletingProduct(null)
        }
    }

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-full bg-gray-100 p-6">
                        <Package className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {search || category ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                        </h3>
                        <p className="text-gray-500 max-w-md">
                            {search || category
                                ? 'Tente ajustar os filtros para encontrar produtos.'
                                : 'Comece criando seu primeiro produto digital.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {cardsError && (
                <Alert variant="destructive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{cardsError}</AlertDescription>
                </Alert>
            )}
            {/* Grid de Cards */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((product) => {
                    // Buscar primeira imagem de capa do produto (mesma da home)
                    const getProductImage = () => {
                        if (product.images && product.images.length > 0) {
                            // Buscar imagem principal (isMain) ou primeira
                            const mainImage = product.images.find(img => img.data)
                            if (mainImage && mainImage.data) {
                                const mimeType = mainImage.mimeType || 'image/jpeg'
                                return `data:${mimeType};base64,${mainImage.data}`
                            }
                        }
                        return null
                    }

                    const productImage = getProductImage()

                    return (
                        <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 border hover:border-[#FED466] overflow-hidden cursor-pointer">
                            {/* Imagem do Produto */}
                            <div className="relative h-24 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                {productImage ? (
                                    <Image
                                        src={productImage}
                                        alt={product.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-gray-300" />
                                    </div>
                                )}
                                
                                {/* Badge de status */}
                                <div className="absolute top-1.5 right-1.5">
                                    <Badge
                                        className={`text-xs shadow-sm ${product.isActive
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-500 text-white"
                                            }`}
                                    >
                                        {product.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                </div>
                            </div>

                            <CardHeader className="pb-1.5 pt-2 px-2.5">
                                <CardTitle className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[2rem] leading-tight">
                                    {product.name}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="pt-0 pb-2.5 px-2.5 space-y-1.5">
                                {/* Preço e Info */}
                                <div className="flex items-center justify-between">
                                    <div className="text-base font-bold text-[#FD9555]">
                                        {formatPrice(product.price)}
                                    </div>
                                    
                                    {product.variations && product.variations.length > 0 && (
                                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                            {product.variations.length} var.
                                        </Badge>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 h-7 text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 cursor-pointer" 
                                        asChild
                                    >
                                        <Link href={`/admin/products/${product.id}`}>
                                            <Eye className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-7 text-xs hover:bg-[#FED466] hover:text-gray-900 hover:border-[#FD9555] cursor-pointer"
                                        onClick={() => setEditingProduct(product)}
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300 cursor-pointer"
                                                disabled={deletingProduct === product.id}
                                            >
                                                {deletingProduct === product.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja excluir o produto &quot;{product.name}&quot;?
                                                    Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(product.id)}
                                                    className="bg-red-600 hover:bg-red-700 cursor-pointer"
                                                >
                                                    Excluir
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                {/* EditProductDialog fora dos botões */}
                                <EditProductDialog
                                    product={editingProduct}
                                    open={!!editingProduct}
                                    onOpenChange={(open) => !open && setEditingProduct(null)}
                                    onSuccess={() => {
                                        setEditingProduct(null)
                                        refreshProducts()
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}