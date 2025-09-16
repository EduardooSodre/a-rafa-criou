import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

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
  // Produtos placeholder se não fornecidos
  const defaultProducts: Product[] = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    name: 'Nome do Produto',
    description: 'Descrição breve do produto...',
    price: 'R$ 19,90'
  }));

  const displayProducts = products || defaultProducts;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Produtos em Destaque
        </h2>

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
                      // TODO: Implementar lógica de adicionar ao carrinho
                      console.log(`Adicionado ao carrinho: ${product.name}`);
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