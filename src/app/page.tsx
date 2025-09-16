'use client';

import HeroSection from '@/components/sections/HeroSection';
import BenefitsSection from '@/components/sections/BenefitsSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import MobileBottomMenu from '@/components/sections/MobileBottomMenu';

export default function HomePage() {
  // Handlers para o menu mobile
  const handleMenuClick = () => {
    // TODO: Implementar abertura do menu lateral
    console.log('Menu clicked');
  };

  const handleHomeClick = () => {
    // TODO: Implementar navegação para home
    console.log('Home clicked');
  };

  const handleCartClick = () => {
    // TODO: Implementar abertura do carrinho
    console.log('Cart clicked');
  };

  const handleSearchClick = () => {
    // TODO: Implementar abertura da busca
    console.log('Search clicked');
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
        cartItemCount={0}
        onMenuClick={handleMenuClick}
        onHomeClick={handleHomeClick}
        onCartClick={handleCartClick}
        onSearchClick={handleSearchClick}
      />
    </>
  );
}