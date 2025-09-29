'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Product } from '@/hooks/use-products';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation('common');
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Card className='group h-full transition-all hover:shadow-lg'>
      <CardHeader className='pb-3'>
        {product.isFeatured && (
          <Badge className='mb-2 w-fit bg-secondary text-secondary-foreground'>
            {t('product.featured', 'Destaque')}
          </Badge>
        )}
        <CardTitle className='line-clamp-2 text-lg group-hover:text-primary'>
          {product.name}
        </CardTitle>
        {product.shortDescription && (
          <CardDescription className='line-clamp-3'>
            {product.shortDescription}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className='flex flex-col justify-between'>
        <div className='mb-4'>
          <div className='mb-2 text-2xl font-bold text-primary'>
            {product.variations && product.variations.length > 1 ? (
              (() => {
                const prices = product.variations.map(v => v.price);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                return min !== max
                  ? `R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ ${max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : `R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              })()
            ) : (
              formatPrice(product.price)
            )}
          </div>
        </div>

        <Button asChild className='w-full bg-primary hover:bg-secondary'>
          <Link href={`/produtos/${product.slug}`}>
            {t('product.viewDetails', 'Ver detalhes')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}