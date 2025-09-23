'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';

interface ProductVariation {
    id: string;
    name: string;
    slug: string;
    price: number;
    isActive: boolean;
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
    const { addItem } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);

    // Responsivo: Mobile 6 produtos (2 por linha), Desktop 8 produtos (4 por linha)
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const initialLimit = isMobile ? 6 : 8;
    const loadMoreLimit = isMobile ? 6 : 8;

    useEffect(() => {
        const fetchProducts = async (currentOffset: number = 0, append: boolean = false) => {
            setLoading(true);
            try {
                const limit = currentOffset === 0 ? initialLimit : loadMoreLimit;
                const response = await fetch(`/api/products?limit=${limit}&offset=${currentOffset}&featured=true`);

                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }

                const data: ApiResponse = await response.json();

                if (append) {
                    setProducts(prev => [...prev, ...data.products]);
                } else {
                    setProducts(data.products);
                }

                setHasMore(data.pagination.hasMore);
                setOffset(currentOffset + limit);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts(0, false);
    }, [initialLimit, loadMoreLimit]);

    const handleLoadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/products?limit=${loadMoreLimit}&offset=${offset}&featured=true`);

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data: ApiResponse = await response.json();

            setProducts(prev => [...prev, ...data.products]);
            setHasMore(data.pagination.hasMore);
            setOffset(offset + loadMoreLimit);
        } catch (error) {
            console.error('Error loading more products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: Product) => {
        // Se tem variações, usa a primeira ativa
        const variation = product.variations.find(v => v.isActive);

        addItem({
            id: variation ? `${product.id}-${variation.id}` : product.id,
            productId: product.id,
            variationId: variation?.id || 'default',
            name: product.name,
            price: variation?.price || product.price,
            variationName: variation?.name || 'Padrão',
            image: product.mainImage?.data || ''
        });
    };

    // Produtos de teste como fallback
    const defaultProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
        id: `test-${i + 1}`,
        name: `PRODUTO DE TESTE ${i + 1}`,
        slug: `produto-teste-${i + 1}`,
        description: 'Descrição do produto de teste para demonstração.',
        shortDescription: 'Descrição breve do produto.',
        price: 19.90 + (i * 5),
        priceDisplay: `R$ ${(19.90 + (i * 5)).toFixed(2).replace('.', ',')}`,
        categoryId: null,
        category: null,
        isFeatured: true,
        variations: [],
        mainImage: null
    }));

    const displayProducts = products.length > 0 ? products : defaultProducts.slice(0, initialLimit);

    return (
        <section className="py-8 bg-gray-50">
            <div className="bg-[#8FBC8F] mb-12 flex items-center justify-center m-0 p-2">
                <h1
                    className="font-scripter text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-[4rem] 2xl:text-[5rem] font-bold m-3 sm:m-4 md:m-5 lg:m-5 xl:m-6 uppercase text-center leading-none"
                    style={{
                        color: '#FFFFFF',
                        fontFamily: 'Scripter, sans-serif',
                        fontSize: 'clamp(2rem, 6vw, 4rem)', // Backup responsivo mais moderado
                    }}
                >
                    TODOS OS ARQUIVOS
                </h1>
            </div>
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6 max-w-7xl mx-auto">
                    {displayProducts.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                        >
                            {/* Imagem do produto com border-radius igual ao botão */}
                            <div className="p-3 md:p-4">
                                <div className="aspect-square bg-gray-100 relative overflow-hidden group rounded-lg">
                                    {product.mainImage ? (
                                        <Image
                                            src={product.mainImage.data}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full rounded-lg">
                                            <span className="text-gray-400 text-sm">Sem imagem</span>
                                        </div>
                                    )}
                                    {/* Badge para produtos novos (IDs 14, 15, 16) */}
                                    {['14', '15', '16'].includes(product.id) && (
                                        <div className="absolute top-2 right-2 bg-[#FED466] text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shadow-md">
                                            🆕 NOVO
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Conteúdo do card com altura fixa para alinhamento */}
                            <div className="px-3 md:px-4 lg:px-4 pb-3 md:pb-4 lg:pb-4 flex flex-col h-[200px] md:h-[210px] lg:h-[220px]">
                                {/* Nome do produto - título principal */}
                                <div className="flex-grow-0 mb-2 md:mb-3">
                                    <h3 className="font-bold text-gray-900 uppercase text-sm md:text-base lg:text-lg leading-tight text-center min-h-[2rem] md:min-h-[2.2rem] lg:min-h-[2.5rem] flex items-center justify-center" style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {product.name}
                                    </h3>
                                </div>

                                {/* Categoria */}
                                <div className="flex-grow-0 mb-2 md:mb-2 lg:mb-3 text-center">
                                    {product.category && (
                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 md:px-3 py-1 rounded-full font-medium">
                                            {product.category.name}
                                        </span>
                                    )}
                                </div>

                                {/* Espaçador flexível para empurrar preço e botão para baixo */}
                                <div className="flex-grow"></div>

                                {/* Preço destacado */}
                                <div className="flex-grow-0 mb-3 md:mb-3 lg:mb-3 text-center">
                                    <span className="text-lg md:text-xl lg:text-2xl font-bold text-[#FD9555] block">
                                        {product.priceDisplay}
                                    </span>
                                </div>

                                {/* Botão full-width sempre alinhado na base */}
                                <div className="flex-grow-0">
                                    <Button
                                        className="w-full bg-[#FD9555] hover:bg-[#FD9555]/90 text-white font-bold py-2 md:py-2 lg:py-3 text-xs md:text-xs lg:text-sm uppercase tracking-wide transition-all duration-200 hover:shadow-lg rounded-lg"
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        ADICIONAR AO CARRINHO
                                    </Button>
                                </div>
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
                            className="font-scripter uppercase text-center leading-none text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold transition-all duration-300 hover:text-yellow-100 px-2 sm:px-4"
                            style={{
                                color: '#FFFFFF',
                                fontFamily: 'Scripter, sans-serif',
                            }}
                        >
                            {loading ? 'CARREGANDO...' : 'CLIQUE PARA VER MAIS ARQUIVOS'}
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
                        <div className="bg-gray-100 inline-block px-6 py-3 rounded-full">
                            <span className="text-gray-600 font-medium">
                                ✨ Todos os arquivos foram exibidos! ✨
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}