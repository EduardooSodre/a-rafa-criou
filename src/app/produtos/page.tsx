'use client';

import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/product-card';
import { ProductCardSkeleton } from '@/components/product-card-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export default function ProductsPage() {
    const { products, isLoading, error } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

    // Filtrar e ordenar produtos
    const filteredProducts = useMemo(() => {
        const filtered = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFeatured = !showFeaturedOnly || product.isFeatured;

            return matchesSearch && matchesFeatured && product.isActive;
        });

        // Ordenar
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    }, [products, searchTerm, sortBy, showFeaturedOnly]);

    if (error) {
        return (
            <div className='container mx-auto p-6'>
                <div className='text-center text-destructive'>
                    Erro ao carregar produtos: {error}
                </div>
            </div>
        );
    }

    return (
        <div className='container mx-auto p-6'>
            {/* Header */}
            <div className='mb-8 text-center'>
                <h1 className='mb-4 text-4xl font-bold text-foreground'>
                    Nossos Produtos
                </h1>
                <p className='text-lg text-muted-foreground'>
                    Descubra conteúdos digitais de qualidade para transformar sua vida
                </p>
            </div>

            {/* Filtros e Busca */}
            <div className='mb-8 rounded-lg border bg-card p-6'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                    {/* Busca */}
                    <div className='md:col-span-2'>
                        <Label htmlFor='search'>Buscar produtos</Label>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                            <Input
                                id='search'
                                placeholder='Digite para buscar...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='pl-10'
                            />
                        </div>
                    </div>

                    {/* Ordenação */}
                    <div>
                        <Label htmlFor='sort'>Ordenar por</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger id='sort'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='name'>Nome</SelectItem>
                                <SelectItem value='price-asc'>Menor preço</SelectItem>
                                <SelectItem value='price-desc'>Maior preço</SelectItem>
                                <SelectItem value='newest'>Mais recentes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filtro Featured */}
                    <div className='flex items-end'>
                        <Button
                            variant={showFeaturedOnly ? 'default' : 'outline'}
                            onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                            className='w-full'
                        >
                            {showFeaturedOnly ? 'Todos' : 'Destacados'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Resultados */}
            <div className='mb-6'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-semibold'>
                        {isLoading ? 'Carregando...' : `${filteredProducts.length} produto(s) encontrado(s)`}
                    </h2>

                    {searchTerm && (
                        <Badge variant='outline'>
                            Busca: &ldquo;{searchTerm}&rdquo;
                        </Badge>
                    )}
                </div>
            </div>

            {/* Grid de Produtos */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {isLoading ? (
                    // Skeletons durante loading
                    Array.from({ length: 6 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : filteredProducts.length > 0 ? (
                    // Produtos encontrados
                    filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    // Nenhum produto encontrado
                    <div className='col-span-full text-center py-12'>
                        <p className='text-lg text-muted-foreground mb-4'>
                            Nenhum produto encontrado
                        </p>
                        <Button
                            variant='outline'
                            onClick={() => {
                                setSearchTerm('');
                                setShowFeaturedOnly(false);
                            }}
                        >
                            Limpar filtros
                        </Button>
                    </div>
                )}
            </div>

            {/* Produtos em Destaque */}
            {!showFeaturedOnly && filteredProducts.length > 0 && (
                <div className='mt-12'>
                    <h2 className='mb-6 text-2xl font-bold text-center'>
                        Produtos em Destaque
                    </h2>
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                        {products
                            .filter(p => p.isFeatured && p.isActive)
                            .slice(0, 3)
                            .map((product) => (
                                <ProductCard key={`featured-${product.id}`} product={product} />
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}