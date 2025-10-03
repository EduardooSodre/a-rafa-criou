import { useState, useEffect } from 'react';

// Tipos para produtos (simulando dados até conectar ao banco)
export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  price: number;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  variations?: ProductVariation[];
  mainImage?: {
    data: string;
    alt: string;
  } | null;
}

export interface ProductVariation {
  id: string;
  productId: string;
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

// Hook para buscar produtos
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulando dados até implementarmos a API real
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Guia Completo de Marketing Digital',
        slug: 'guia-marketing-digital',
        shortDescription: 'Aprenda as melhores estratégias de marketing digital para 2024',
        description:
          'Um guia completo com mais de 100 páginas sobre marketing digital, incluindo SEO, redes sociais, e-mail marketing e muito mais.',
        price: 47.9,
        isFeatured: true,
        isActive: true,
        seoTitle: 'Guia de Marketing Digital - A Rafa Criou',
        seoDescription:
          'Baixe o guia completo de marketing digital e aprenda as estratégias que realmente funcionam.',
        createdAt: new Date(),
        updatedAt: new Date(),
        variations: [
          {
            id: '1a',
            productId: '1',
            name: 'Versão Básica',
            slug: 'basica',
            price: 47.9,
            isActive: true,
            sortOrder: 1,
          },
          {
            id: '1b',
            productId: '1',
            name: 'Versão Premium (com bônus)',
            slug: 'premium',
            price: 97.9,
            isActive: true,
            sortOrder: 2,
          },
        ],
      },
      {
        id: '2',
        name: 'Planejador Financeiro Pessoal',
        slug: 'planejador-financeiro',
        shortDescription: 'Organize suas finanças de forma simples e eficaz',
        description:
          'Planejador em PDF editável para controlar gastos, definir metas e alcançar a liberdade financeira.',
        price: 27.9,
        isFeatured: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'E-book: Receitas Saudáveis',
        slug: 'receitas-saudaveis',
        shortDescription: '50 receitas práticas e saudáveis para o dia a dia',
        description:
          'Coletânea de receitas testadas e aprovadas, com ingredientes fáceis de encontrar.',
        price: 19.9,
        isFeatured: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Simular loading
    setTimeout(() => {
      setProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
  }, []);

  return { products, isLoading };
}

// Hook para buscar produto individual
export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulando dados até implementarmos a API real
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Guia Completo de Marketing Digital',
        slug: 'guia-marketing-digital',
        shortDescription: 'Aprenda as melhores estratégias de marketing digital para 2024',
        description:
          'Um guia completo com mais de 100 páginas sobre marketing digital, incluindo SEO, redes sociais, e-mail marketing e muito mais.',
        price: 47.9,
        isFeatured: true,
        isActive: true,
        seoTitle: 'Guia de Marketing Digital - A Rafa Criou',
        seoDescription:
          'Baixe o guia completo de marketing digital e aprenda as estratégias que realmente funcionam.',
        createdAt: new Date(),
        updatedAt: new Date(),
        variations: [
          {
            id: '1a',
            productId: '1',
            name: 'Versão Básica',
            slug: 'basica',
            price: 47.9,
            isActive: true,
            sortOrder: 1,
          },
          {
            id: '1b',
            productId: '1',
            name: 'Versão Premium (com bônus)',
            slug: 'premium',
            price: 97.9,
            isActive: true,
            sortOrder: 2,
          },
        ],
      },
      {
        id: '2',
        name: 'Planejador Financeiro Pessoal',
        slug: 'planejador-financeiro',
        shortDescription: 'Organize suas finanças de forma simples e eficaz',
        description:
          'Planejador em PDF editável para controlar gastos, definir metas e alcançar a liberdade financeira.',
        price: 27.9,
        isFeatured: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'E-book: Receitas Saudáveis',
        slug: 'receitas-saudaveis',
        shortDescription: '50 receitas práticas e saudáveis para o dia a dia',
        description:
          'Coletânea de receitas testadas e aprovadas, com ingredientes fáceis de encontrar.',
        price: 19.9,
        isFeatured: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Simular busca por slug
    setTimeout(() => {
      const foundProduct = mockProducts.find(p => p.slug === slug);
      setProduct(foundProduct || null);
      setIsLoading(false);

      if (!foundProduct) {
        setError('Produto não encontrado');
      }
    }, 800);
  }, [slug, setError]);

  return { product, isLoading, error };
}
