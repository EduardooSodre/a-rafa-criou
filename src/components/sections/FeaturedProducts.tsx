'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getPreviewSrc } from '@/lib/r2-utils';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/components/ui/toast';
import { AddToCartSheet } from '@/components/sections/AddToCartSheet';

interface ProductVariation {
    id: string;
    name: string;
    slug: string;
    price: number;
    isActive: boolean;
    sortOrder: number;
    attributeValues?: {
        attributeId: string;
        attributeName: string | null;
        valueId: string;
        value: string | null;
    }[];
}

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    price: number;
    priceDisplay: string;
    categoryId: string | null;
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
    isFeatured: boolean;
    createdAt: Date | string;
    variations: ProductVariation[];
    mainImage: {
        data: string;
        alt: string | null;
    } | null;
}

interface FeaturedProductsProps {
    showViewAll?: boolean;
}

interface ApiResponse {
    products: Product[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export default function FeaturedProducts({
    showViewAll = true
}: FeaturedProductsProps) {
    const { t } = useTranslation('common')
    const { addItem } = useCart();
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showAddToCart, setShowAddToCart] = useState(false);

    // Limite fixo para evitar problemas de hidratação
    const initialLimit = 8;
    const loadMoreLimit = 8;

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Buscar todos os produtos ordenados por data (mais recentes primeiro)
                const response = await fetch(`/api/products?limit=${initialLimit}&offset=0`);

                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }

                const data: ApiResponse = await response.json();

                setProducts(Array.isArray(data.products) ? data.products : []);
                setHasMore(Boolean(data.pagination.hasMore));
                setOffset(initialLimit);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleLoadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            // Buscar mais produtos ordenados por data (mais recentes primeiro)
            const response = await fetch(`/api/products?limit=${loadMoreLimit}&offset=${offset}`);

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data: ApiResponse = await response.json();

            setProducts(prev => [...prev, ...(Array.isArray(data.products) ? data.products : [])]);
            setHasMore(Boolean(data.pagination.hasMore));
            setOffset(offset + loadMoreLimit);
        } catch (error) {
            console.error('Error loading more products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: Product) => {
        // Verificar se tem variações com atributos
        const hasVariationsWithAttributes = product.variations && product.variations.length > 1 &&
            product.variations.some(v => v.isActive && v.attributeValues && v.attributeValues.length > 0);

        if (hasVariationsWithAttributes) {
            // Abrir sheet de seleção
            setSelectedProduct(product);
            setShowAddToCart(true);
        } else {
            // Se não tem variações ou atributos, adiciona direto
            const variation = product.variations.find(v => v.isActive);

            addItem({
                id: variation ? `${product.id}-${variation.id}` : product.id,
                productId: product.id,
                variationId: variation?.id || 'default',
                name: t(`productNames.${product.slug}`, { defaultValue: product.name }),
                price: variation?.price || product.price,
                variationName: variation?.name || 'Padrão',
                image: product.mainImage?.data || '',
                attributes: variation?.attributeValues?.map(attr => ({
                    name: attr.attributeName || '',
                    value: attr.value || ''
                })) || []
            });

            // Mostrar toast de confirmação
            showToast(t('cart.addedToCart', { product: t(`productNames.${product.slug}`, { defaultValue: product.name }) }), 'success');
        }
    };

    // Produtos fallback simples
    const displayProducts = products.length > 0 ? products : [];

    // Loading skeleton para evitar flash
    if (loading && products.length === 0) {
        return (
            <section className="py-8 bg-gray-50">
                <div className="bg-[#8FBC8F] mb-12 flex items-center justify-center m-0 p-2">
                    <h1
                        className="font-scripter text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-[4rem] 2xl:text-[5rem] font-bold m-3 sm:m-4 md:m-5 lg:m-5 xl:m-6 uppercase text-center leading-none"
                        style={{
                            color: '#FFFFFF',
                            fontFamily: 'Scripter, sans-serif',
                            fontSize: 'clamp(2rem, 6vw, 4rem)',
                        }}
                    >
                        {t('featured.allFiles', 'TODOS OS ARQUIVOS')}
                    </h1>
                </div>
                <div className="container mx-auto px-4 mb-22">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 max-w-7xl mx-auto">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                                <div className="p-3 md:p-4">
                                    <div className="aspect-square bg-gray-200 rounded-lg"></div>
                                </div>
                                <div className="px-3 md:px-4 lg:px-4 pb-3 md:pb-4 lg:pb-4">
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-8 bg-gray-50">
            <div className="bg-[#8FBC8F] mb-12 flex items-center justify-center m-0 p-2">
                <h1
                    className="font-scripter text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-[4rem] 2xl:text-[5rem] font-bold m-3 sm:m-4 md:m-5 lg:m-5 xl:m-6 uppercase text-center leading-none"
                    style={{
                        color: '#FFFFFF',
                        fontFamily: 'Scripter, sans-serif',
                        fontSize: 'clamp(2rem, 6vw, 4rem)',
                    }}
                >
                    {t('featured.allFiles', 'TODOS OS ARQUIVOS')}
                </h1>
            </div>
            <div className="container mx-auto px-4 mb-22">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 max-w-7xl mx-auto">
                    {displayProducts.map((product, index) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col justify-between"
                        >
                            <div>
                                <Link href={`/produtos/${product.slug}`} className="block group focus:outline-none focus:ring-2 focus:ring-primary">
                                    <div className="p-3 md:p-4">
                                        <div className="aspect-square bg-gray-100 relative overflow-hidden group rounded-lg">
                                            {product.mainImage && product.mainImage.data ? (
                                                <Image
                                                    src={getPreviewSrc(product.mainImage.data)}
                                                    alt={product.mainImage.alt || product.name}
                                                    fill
                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg bg-[#F4F4F4]"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full rounded-lg bg-[#F4F4F4]">
                                                    <span className="text-gray-400 text-sm">{t('product.noImage', 'Sem imagem')}</span>
                                                </div>
                                            )}
                                            {/* Badge para os 2 produtos mais recentes */}
                                            {index < 2 && (
                                                <div className="absolute top-2 right-2 bg-[#FED466] text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shadow-md">
                                                    {t('product.new', 'NOVO')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Nome do produto - título principal */}
                                    <div className="px-3 md:px-4 lg:px-4 flex flex-col">
                                        <div className="flex-grow-0 mb-2 md:mb-3">
                                            <h3 className="font-bold text-gray-900 uppercase text-sm md:text-base lg:text-lg leading-tight text-center min-h-[2rem] md:min-h-[2.2rem] lg:min-h-[2.5rem] flex items-center justify-center" style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {t(`productNames.${product.slug}`, { defaultValue: product.name })}
                                            </h3>
                                        </div>
                                        {/* Categoria */}
                                        <div className="flex-grow-0 mb-2 md:mb-2 lg:mb-3 text-center">
                                            {product.category && (
                                                <span className="text-xs bg-orange-200 text-gray-700 px-2 md:px-3 py-1 rounded-full font-medium">
                                                    {t(`productCategories.${product.category.slug}`, { defaultValue: product.category.name })}
                                                </span>
                                            )}
                                        </div>
                                        {/* Preço destacado */}
                                        <div className="flex-grow-0 mb-3 md:mb-3 lg:mb-3 text-center">
                                            <span className="text-lg md:text-xl lg:text-2xl font-bold text-[#FD9555] block">
                                                {product.variations && product.variations.length > 1 ? (
                                                    (() => {
                                                        const prices = product.variations.map(v => v.price);
                                                        const min = Math.min(...prices);
                                                        const max = Math.max(...prices);
                                                        return min !== max
                                                            ? `R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                            : `R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                                    })()
                                                ) : (
                                                    `R$ ${product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            {/* Botão full-width sempre alinhado na base, fora do link */}
                            <div className="px-3 md:px-4 lg:px-4 pb-3 md:pb-4 lg:pb-4 mt-auto">
                                <Button
                                    className="w-full bg-[#FD9555] hover:bg-[#FD9555]/90 text-white font-bold py-2 md:py-2 lg:py-3 text-xs md:text-xs lg:text-sm uppercase tracking-wide transition-all duration-200 hover:shadow-lg rounded-lg cursor-pointer"
                                    onClick={() => handleAddToCart(product)}
                                >
                                    <span className="sm:hidden">{t('nav.cart', 'CARRINHO')}</span>
                                    <span className="hidden sm:inline">{t('product.addToCart', 'ADICIONAR AO CARRINHO')}</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {showViewAll && hasMore && (
                    <div
                        onClick={handleLoadMore}
                        className="bg-[#8FBC8F] mt-12 flex items-center justify-center p-3 sm:p-4 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto rounded-full gap-2 sm:gap-4 hover:bg-[#7DAB7D] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-lg hover:shadow-xl"
                    >
                        <Image
                            src="/arrow.png"
                            alt="Seta esquerda"
                            width={32}
                            height={32}
                            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:animate-pulse"
                        />
                        <div
                            className="font-scripter uppercase text-center leading-none text-xl lg:text-2xl xl:text-3xl font-bold transition-all duration-300 hover:text-yellow-100 px-2 sm:px-4"
                            style={{
                                color: '#FFFFFF',
                                fontFamily: 'Scripter, sans-serif',
                            }}
                        >
                            {loading ? t('featured.loading', 'CARREGANDO...') : t('featured.viewMore', 'CLIQUE PARA VER MAIS ARQUIVOS')}
                        </div>
                        <Image
                            src="/arrow.png"
                            alt="Seta direita"
                            width={32}
                            height={32}
                            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:animate-pulse"
                        />
                    </div>
                )}

                {showViewAll && !hasMore && !loading && products.length > 0 && (
                    <div className="mt-12 text-center">
                        <div className="bg-gray-200 inline-block px-6 py-3 rounded-full">
                            <span className="text-gray-600 font-medium">
                                {t('featured.endMessage', '✨ Todos os arquivos foram exibidos! ✨')}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Sheet de seleção de atributos */}
            {selectedProduct && (
                <AddToCartSheet
                    open={showAddToCart}
                    onOpenChange={setShowAddToCart}
                    product={{
                        id: selectedProduct.id,
                        name: selectedProduct.name,
                        slug: selectedProduct.slug,
                        price: selectedProduct.price,
                        mainImage: selectedProduct.mainImage ? {
                            data: selectedProduct.mainImage.data,
                            alt: selectedProduct.mainImage.alt || selectedProduct.name
                        } : null,
                        variations: selectedProduct.variations
                    }}
                />
            )}
        </section>
    );
}