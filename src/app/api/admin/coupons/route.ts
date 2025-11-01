import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { coupons, couponProducts, couponVariations } from '@/lib/db/schema';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';

const createCouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  minSubtotal: z.number().nonnegative().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().default(1),
  appliesTo: z.enum(['all', 'products', 'variations']).default('all'),
  productIds: z.array(z.string().uuid()).optional(),
  variationIds: z.array(z.string().uuid()).optional(),
  stackable: z.boolean().default(false),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const allCoupons = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt));

    return NextResponse.json({ coupons: allCoupons });
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCouponSchema.parse(body);

    // Verificar se o código já existe
    const existingCoupon = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, validatedData.code))
      .limit(1);

    if (existingCoupon.length > 0) {
      return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 400 });
    }

    // Criar o cupom
    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: validatedData.code,
        type: validatedData.type,
        value: validatedData.value.toString(),
        minSubtotal: validatedData.minSubtotal?.toString() || null,
        maxUses: validatedData.maxUses || null,
        maxUsesPerUser: validatedData.maxUsesPerUser,
        appliesTo: validatedData.appliesTo,
        stackable: validatedData.stackable,
        isActive: validatedData.isActive,
        startsAt: validatedData.startsAt ? new Date(validatedData.startsAt) : null,
        endsAt: validatedData.endsAt ? new Date(validatedData.endsAt) : null,
        createdBy: session.user.id,
      })
      .returning();

    // Associar produtos se aplicável
    if (validatedData.appliesTo === 'products' && validatedData.productIds?.length) {
      await db.insert(couponProducts).values(
        validatedData.productIds.map(productId => ({
          couponId: newCoupon.id,
          productId,
        }))
      );
    }

    // Associar variações se aplicável
    if (validatedData.appliesTo === 'variations' && validatedData.variationIds?.length) {
      await db.insert(couponVariations).values(
        validatedData.variationIds.map(variationId => ({
          couponId: newCoupon.id,
          variationId,
        }))
      );
    }

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 });
    }

    console.error('Erro ao criar cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
