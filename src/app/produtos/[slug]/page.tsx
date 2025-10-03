import { ProductDetailEnhanced } from "@/components/product-detail-enhanced";
import { getProductBySlug } from "@/lib/db/products";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface ProductPageProps {
    params: { slug: string };
}

// ISR: Revalida a cada 1 hora (3600 segundos)
export const revalidate = 3600;

// Metadata dinâmico para SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const p = await params;
    const product = await getProductBySlug(p.slug);
    
    if (!product) {
        return {
            title: 'Produto não encontrado | A Rafa Criou',
        };
    }

    return {
        title: `${product.name} | A Rafa Criou`,
        description: product.description || `Compre ${product.name} - PDF digital para download imediato`,
        openGraph: {
            title: `${product.name} | A Rafa Criou`,
            description: product.description || '',
            type: 'website',
            images: product.images && product.images.length > 0 ? [product.images[0]] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${product.name} | A Rafa Criou`,
            description: product.description || '',
            images: product.images && product.images.length > 0 ? [product.images[0]] : [],
        },
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const p = await params;
    const product = await getProductBySlug(p.slug);
    
    if (!product) {
        return notFound();
    }

    // Structured Data (JSON-LD) para SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.name,
        'description': product.description,
        'image': product.images && product.images.length > 0 ? product.images : [],
        'offers': {
            '@type': 'Offer',
            'price': product.basePrice.toFixed(2),
            'priceCurrency': 'BRL',
            'availability': 'https://schema.org/InStock',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductDetailEnhanced product={product} />
        </>
    );
}
