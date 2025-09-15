import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="w-full">
      {/* Hero Section - Tamanho real sem espaços */}
      <section className="relative w-full flex items-center justify-center bg-[#F4F4F4] overflow-hidden">
        <div className="relative w-full max-w-none">
          <Image
            src="/Banner_principal.gif"
            alt="Hero Background Animation"
            width={1920}
            height={600}
            className="w-full h-auto block"
            priority
            unoptimized={true}
            quality={100}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      </section>

      {/* Seção de Benefícios */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Automático */}
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-32 h-32 bg-[#FD9555] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Image
                  src="/automatico.webp"
                  alt="Automático"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">AUTOMÁTICO</h3>
              <p className="text-gray-600 text-center px-4">
                ARQUIVO LIBERADO<br />
                AUTOMATICAMENTE APÓS<br />
                CONFIRMAÇÃO DE PAGAMENTO
              </p>
            </div>

            {/* Prático */}
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-32 h-32 bg-[#FD9555] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Image
                  src="/pratico.webp"
                  alt="Prático"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">PRÁTICO</h3>
              <p className="text-gray-600 text-center px-4">
                BAIXE SEU ARQUIVO E MONTE EM<br />
                CASA, NÃO PRECISA PAGAR FRETE
              </p>
            </div>

            {/* Econômico */}
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="w-32 h-32 bg-[#FD9555] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow">
                <Image
                  src="/economico.webp"
                  alt="Econômico"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">ECONÔMICO</h3>
              <p className="text-gray-600 text-center px-4">
                IMPRIMA O MESMO ARQUIVO<br />
                QUANTAS VEZES QUISER
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Produtos Destacados */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Produtos em Destaque
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Placeholder para produtos - será substituído por componente real */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Produto {i + 1}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Nome do Produto</h3>
                  <p className="text-gray-600 text-sm mb-3">Descrição breve do produto...</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#FD9555]">R$ 19,90</span>
                    <Button size="sm" className="bg-[#FD9555] hover:bg-[#FD9555]/90">
                      Comprar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="border-[#FD9555] text-[#FD9555] hover:bg-[#FD9555] hover:text-white">
              <Link href="/produtos">
                Ver Todos os Produtos
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}