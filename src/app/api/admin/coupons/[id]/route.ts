import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { coupons, couponProducts, couponVariations } from '@/lib/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase().optional(),
  type: z.enum(['percent', 'fixed']).optional(),
  value: z.number().positive().optional(),
  minSubtotal: z.number().nonnegative().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().optional(),
  appliesTo: z.enum(['all', 'products', 'variations']).optional(),
  productIds: z.array(z.string().uuid()).optional(),
  variationIds: z.array(z.string().uuid()).optional(),
  stackable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);

    if (!coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Erro ao buscar cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCouponSchema.parse(body);

    const [existingCoupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (validatedData.code) updateData.code = validatedData.code;
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.value !== undefined) updateData.value = validatedData.value.toString();
    if (validatedData.minSubtotal !== undefined)
      updateData.minSubtotal = validatedData.minSubtotal?.toString() || null;
    if (validatedData.maxUses !== undefined) updateData.maxUses = validatedData.maxUses;
    if (validatedData.maxUsesPerUser !== undefined)
      updateData.maxUsesPerUser = validatedData.maxUsesPerUser;
    if (validatedData.appliesTo) updateData.appliesTo = validatedData.appliesTo;
    if (validatedData.stackable !== undefined) updateData.stackable = validatedData.stackable;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.startsAt !== undefined)
      updateData.startsAt = validatedData.startsAt ? new Date(validatedData.startsAt) : null;
    if (validatedData.endsAt !== undefined)
      updateData.endsAt = validatedData.endsAt ? new Date(validatedData.endsAt) : null;

    const [updatedCoupon] = await db
      .update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();

    // Atualizar produtos associados
    if (validatedData.productIds !== undefined) {
      await db.delete(couponProducts).where(eq(couponProducts.couponId, id));
      if (validatedData.productIds.length > 0) {
        await db.insert(couponProducts).values(
          validatedData.productIds.map(productId => ({
            couponId: id,
            productId,
          }))
        );
      }
    }

    // Atualizar variações associadas
    if (validatedData.variationIds !== undefined) {
      await db.delete(couponVariations).where(eq(couponVariations.couponId, id));
      if (validatedData.variationIds.length > 0) {
        await db.insert(couponVariations).values(
          validatedData.variationIds.map(variationId => ({
            couponId: id,
            variationId,
          }))
        );
      }
    }

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const [existingCoupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    await db.delete(coupons).where(eq(coupons.id, id));

    return NextResponse.json({ message: 'Cupom excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
