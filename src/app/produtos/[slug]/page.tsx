import { ProductDetailClient } from "@/components/product-detail-client";
import { getProductBySlug } from "@/lib/db/products";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) return notFound();
  return <ProductDetailClient product={product} />;
}
