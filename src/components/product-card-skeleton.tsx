import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ProductCardSkeleton() {
    return (
        <Card className='h-full'>
            <CardHeader className='pb-3'>
                <Skeleton className='mb-2 h-5 w-20' />
                <Skeleton className='h-6 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
            </CardHeader>

            <CardContent>
                <Skeleton className='mb-2 h-8 w-24' />
                <Skeleton className='mb-4 h-4 w-32' />
                <Skeleton className='h-10 w-full' />
            </CardContent>
        </Card>
    );
}