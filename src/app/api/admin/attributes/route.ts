import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { attributes, attributeValues } from '@/lib/db/schema';
import { inArray, eq } from 'drizzle-orm';

const createAttributeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  values: z.array(z.object({ value: z.string().min(1), slug: z.string().min(1) })).optional(),
});

const addValueSchema = z.object({
  attributeId: z.string().min(1),
  value: z.string().min(1),
  slug: z.string().min(1),
});

// GET - Buscar todos os atributos com valores
export async function GET() {
  const attrs = await db.select().from(attributes).orderBy(attributes.name).execute();
  const ids = attrs.map(a => a.id);
  const vals = ids.length
    ? await db
        .select()
        .from(attributeValues)
        .where(inArray(attributeValues.attributeId, ids))
        .orderBy(attributeValues.value)
        .execute()
    : [];

  const byAttr = new Map<string, Array<Record<string, unknown>>>();
  for (const v of vals) {
    const aId = v.attributeId as string;
    if (!byAttr.has(aId)) byAttr.set(aId, []);
    byAttr.get(aId)!.push(v);
  }

  const result = attrs.map(a => ({ ...a, values: byAttr.get(a.id) ?? [] }));
  return NextResponse.json(result);
}

// POST - Criar novo atributo OU adicionar valor a existente
export async function POST(req: Request) {
  const body = await req.json();

  // Se contém attributeId, é para adicionar valor a atributo existente
  if (body.attributeId) {
    const parse = addValueSchema.safeParse(body);
    if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });

    const { attributeId, value, slug } = parse.data;

    // Verificar se valor já existe
    const existing = await db
      .select()
      .from(attributeValues)
      .where(eq(attributeValues.attributeId, attributeId))
      .execute();

    const valueExists = existing.some(v => v.slug === slug);
    if (valueExists) {
      return NextResponse.json(
        { error: 'Este valor já existe para este atributo' },
        { status: 400 }
      );
    }

    // Inserir novo valor
    const [inserted] = await db
      .insert(attributeValues)
      .values({ attributeId, value, slug })
      .returning();

    return NextResponse.json({ ok: true, value: inserted });
  }

  // Criar novo atributo
  const parse = createAttributeSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });

  const { name, slug, values } = parse.data;

  // Verificar se atributo já existe
  const existingAttr = await db
    .select()
    .from(attributes)
    .where(eq(attributes.slug, slug))
    .execute();

  if (existingAttr.length > 0) {
    return NextResponse.json(
      { error: 'Atributo com este nome já existe', existingId: existingAttr[0].id },
      { status: 400 }
    );
  }

  const [inserted] = await db.insert(attributes).values({ name, slug }).returning();

  if (values && values.length) {
    const toInsert = values.map(v => ({ attributeId: inserted.id, value: v.value, slug: v.slug }));
    await db.insert(attributeValues).values(toInsert).execute();
  }

  return NextResponse.json({ ok: true, id: inserted.id, attribute: inserted });
}
