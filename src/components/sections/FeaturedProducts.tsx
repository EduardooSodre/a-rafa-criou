import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';

interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    image?: string;
}

interface FeaturedProductsProps {
    products?: Product[];
    showViewAll?: boolean;
}

export default function FeaturedProducts({
    products,
    showViewAll = true
}: FeaturedProductsProps) {
    const { addItem } = useCart();
    // Produtos placeholder se não fornecidos
    const defaultProducts: Product[] = Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        name: 'Nome do Produto',
        description: 'Descrição breve do produto...',
        price: 'R$ 19,90'
    }));

    const displayProducts = products || defaultProducts;

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {displayProducts.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div className="aspect-square bg-gray-200 flex items-center justify-center">
                                {product.image ? (
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        width={300}
                                        height={300}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-gray-400">Produto {product.id}</span>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold mb-2">{product.name}</h3>
                                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-[#FD9555]">{product.price}</span>
                                    <Button
                                        size="sm"
                                        className="bg-[#FD9555] hover:bg-[#FD9555]/90"
                                        onClick={() => {
                                            addItem({
                                                id: `product-${product.id}`,
                                                productId: product.id.toString(),
                                                variationId: 'default',
                                                name: product.name,
                                                price: parseFloat(product.price.replace('R$', '').replace(',', '.')),
                                                variationName: 'Padrão',
                                                image: product.image || ''
                                            });
                                        }}
                                    >
                                        Comprar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {showViewAll && (
                    <div className="text-center mt-12">
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="border-[#FD9555] text-[#FD9555] hover:bg-[#FD9555] hover:text-white"
                        >
                            <Link href="/produtos">
                                Ver Todos os Produtos
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}