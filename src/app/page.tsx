'use client';

import { useRouter } from 'next/navigation';
import HeroSection from '@/components/sections/HeroSection';
import BenefitsSection from '@/components/sections/BenefitsSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import MobileBottomMenu from '@/components/sections/MobileBottomMenu';
import { useCart } from '@/contexts/cart-context';

export default function HomePage() {
  const { totalItems } = useCart();
  const router = useRouter();

  // Handlers para o menu mobile conectados com as funcionalidades reais
  const handleMenuClick = () => {
    // Navegar para a página de produtos que funciona como menu principal
    router.push('/produtos');
  };

  const handleHomeClick = () => {
    // Scroll suave para o topo da página (apenas no cliente)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCartClick = () => {
    // Navegar para a página do carrinho que já existe
    router.push('/carrinho');
  };

  const handleSearchClick = () => {
    // Navegar para a página de produtos com foco na busca
    router.push('/produtos?focus=search');
  };

  return (
    <>
      <main className="w-full pb-24 md:pb-0">
        {/* Hero Section */}
        <HeroSection />

        {/* Seção de Benefícios */}
        <BenefitsSection />

        {/* Seção de Produtos Destacados */}
        <FeaturedProducts />
      </main>

      {/* Menu fixo inferior apenas no mobile */}
      <MobileBottomMenu
        cartItemCount={totalItems}
        onMenuClick={handleMenuClick}
        onHomeClick={handleHomeClick}
        onCartClick={handleCartClick}
        onSearchClick={handleSearchClick}
      />
    </>
  );
}