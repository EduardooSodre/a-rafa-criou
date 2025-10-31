'use client';

import { useEffect } from 'react';
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

  // SEO Meta Tags
  useEffect(() => {
    // Atualizar título
    document.title = 'A Rafa Criou - Arquivos Digitais para Festas e Organização';
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Descubra arquivos digitais teocráticos para organização, festas e presentes. PDFs para imprimir, personalizáveis e prontos para uso.');
    }
    
    // Meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'arquivos digitais, PDFs para imprimir, organização, festas, presentes, teocráticos, A Rafa Criou');
    
    // Open Graph
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateMetaTag('og:title', 'A Rafa Criou - Arquivos Digitais para Festas');
    updateMetaTag('og:description', 'Descubra uma coleção de arquivos digitais teocráticos para organização, festas e presentes.');
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:url', typeof window !== 'undefined' ? window.location.href : 'https://arafa.com.br');
    updateMetaTag('og:image', 'https://arafa.com.br/Banner_principal.gif');
    updateMetaTag('og:locale', 'pt_BR');
    
    // Twitter Card
    const updateTwitterTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    updateTwitterTag('twitter:card', 'summary_large_image');
    updateTwitterTag('twitter:title', 'A Rafa Criou - Arquivos Digitais para Festas');
    updateTwitterTag('twitter:description', 'Descubra uma coleção de arquivos digitais teocráticos para organização, festas e presentes.');
    updateTwitterTag('twitter:image', 'https://arafa.com.br/Banner_principal.gif');
  }, []);

  return (
    <>
      <main className="w-full pb-20 md:pb-0">
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