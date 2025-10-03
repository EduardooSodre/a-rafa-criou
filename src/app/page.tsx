'use client';

import HeroSection from '@/components/sections/HeroSection';
import BenefitsSection from '@/components/sections/BenefitsSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import MobileBottomMenu from '@/components/sections/MobileBottomMenu';

export default function HomePage() {
  const handleHomeClick = () => {
    // Scroll suave para o topo da página (apenas no cliente)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      <MobileBottomMenu onHomeClick={handleHomeClick} />
    </>
  );
}