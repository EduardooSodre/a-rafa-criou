import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/product-detail-client'

interface ProductPageProps {
    params: {
        slug: string
    }
}

// Esta função será chamada em build time para gerar as páginas estáticas
export async function generateStaticParams() {
    // Em produção, buscar todos os slugs de produtos do banco
    // Por enquanto retornamos os produtos mock
    return [
        { slug: 'ebook-javascript-moderno' },
        { slug: 'curso-react-completo' },
        { slug: 'template-landing-page' },
        { slug: 'guia-css-grid' },
        { slug: 'ebook-typescript' },
        { slug: 'curso-nextjs' }
    ]
}

export default async function ProductPage({ params }: ProductPageProps) {
    // Em produção, buscar produto pelo slug do banco de dados
    // Por enquanto usamos dados mock
    const { slug } = await params
    const product = await getProductBySlug(slug)

    if (!product) {
        notFound()
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <ProductDetailClient product={product} />
        </div>
    )
}

// Função mock para buscar produto por slug
async function getProductBySlug(slug: string) {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 100))

    const products = [
        {
            id: '1',
            name: 'E-book: JavaScript Moderno',
            slug: 'ebook-javascript-moderno',
            description: 'Aprenda JavaScript moderno com ES6+, async/await, módulos e muito mais. Um guia completo para desenvolvedores.',
            longDescription: `
        <h3>O que você vai aprender:</h3>
        <ul>
          <li>ES6+ features: let, const, arrow functions</li>
          <li>Destructuring e spread operator</li>
          <li>Promises e async/await</li>
          <li>Módulos ES6</li>
          <li>Classes e herança</li>
          <li>Map, Set e outros tipos de dados</li>
        </ul>
        <h3>Para quem é este e-book:</h3>
        <p>Desenvolvedores iniciantes e intermediários que querem dominar o JavaScript moderno.</p>
        <h3>Formato:</h3>
        <p>PDF com 150 páginas, exemplos práticos e exercícios.</p>
      `,
            basePrice: 29.90,
            category: 'E-books',
            tags: ['javascript', 'programação', 'web'],
            images: [
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
                'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800'
            ],
            variations: [
                {
                    id: '1-1',
                    name: 'PDF Simples',
                    price: 29.90,
                    description: 'E-book em formato PDF',
                    downloadLimit: 3,
                    fileSize: '5.2 MB'
                },
                {
                    id: '1-2',
                    name: 'PDF + Códigos de Exemplo',
                    price: 39.90,
                    description: 'E-book + arquivo ZIP com todos os códigos',
                    downloadLimit: 5,
                    fileSize: '12.8 MB'
                }
            ]
        },
        {
            id: '2',
            name: 'Curso: React Completo',
            slug: 'curso-react-completo',
            description: 'Curso completo de React com Hooks, Context API, React Router e projetos práticos.',
            longDescription: `
        <h3>Conteúdo do curso:</h3>
        <ul>
          <li>Fundamentos do React</li>
          <li>Componentes e Props</li>
          <li>State e Lifecycle</li>
          <li>Hooks (useState, useEffect, useContext)</li>
          <li>React Router</li>
          <li>Context API</li>
          <li>Projetos práticos</li>
        </ul>
        <h3>O que está incluso:</h3>
        <p>8 horas de vídeo aulas, códigos de exemplo e 3 projetos práticos.</p>
      `,
            basePrice: 89.90,
            category: 'Cursos',
            tags: ['react', 'javascript', 'frontend'],
            images: [
                'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
                'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800'
            ],
            variations: [
                {
                    id: '2-1',
                    name: 'Acesso Básico',
                    price: 89.90,
                    description: 'Acesso às vídeo aulas por 6 meses',
                    downloadLimit: 1,
                    fileSize: '2.1 GB'
                },
                {
                    id: '2-2',
                    name: 'Acesso Premium',
                    price: 129.90,
                    description: 'Acesso vitalício + certificado + suporte',
                    downloadLimit: 10,
                    fileSize: '2.1 GB'
                }
            ]
        },
        {
            id: '3',
            name: 'Template: Landing Page',
            slug: 'template-landing-page',
            description: 'Template responsivo de landing page em HTML, CSS e JavaScript puro.',
            longDescription: `
        <h3>Características:</h3>
        <ul>
          <li>Design responsivo</li>
          <li>Otimizado para conversão</li>
          <li>Animações suaves</li>
          <li>Formulário de contato integrado</li>
          <li>SEO friendly</li>
        </ul>
        <h3>Tecnologias:</h3>
        <p>HTML5, CSS3, JavaScript ES6+, sem dependências externas.</p>
      `,
            basePrice: 49.90,
            category: 'Templates',
            tags: ['html', 'css', 'landing-page'],
            images: [
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
                'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'
            ],
            variations: [
                {
                    id: '3-1',
                    name: 'Template Básico',
                    price: 49.90,
                    description: 'Código fonte completo',
                    downloadLimit: 5,
                    fileSize: '8.5 MB'
                },
                {
                    id: '3-2',
                    name: 'Template + PSD',
                    price: 69.90,
                    description: 'Código fonte + arquivo Photoshop editável',
                    downloadLimit: 3,
                    fileSize: '45.2 MB'
                }
            ]
        }
    ]

    return products.find(p => p.slug === slug) || null
}

// Metadados dinâmicos para SEO
export async function generateMetadata({ params }: ProductPageProps) {
    const { slug } = await params
    const product = await getProductBySlug(slug)

    if (!product) {
        return {
            title: 'Produto não encontrado'
        }
    }

    return {
        title: `${product.name} | A Rafa Criou`,
        description: product.description,
        openGraph: {
            title: product.name,
            description: product.description,
            images: product.images,
        }
    }
}