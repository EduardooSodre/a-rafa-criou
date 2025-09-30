import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { attributes, attributeValues } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

const createAttributeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  values: z.array(z.object({ value: z.string().min(1), slug: z.string().min(1) })).optional(),
});

export async function GET() {
  const attrs = await db.select().from(attributes).orderBy(attributes.sortOrder).execute();
  const ids = attrs.map(a => a.id);
  const vals = ids.length
    ? await db.select().from(attributeValues).where(inArray(attributeValues.attributeId, ids)).orderBy(attributeValues.sortOrder).execute()
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

export async function POST(req: Request) {
  const body = await req.json();
  const parse = createAttributeSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.format() }, { status: 400 });

  const { name, slug, values } = parse.data;

  const [inserted] = await db.insert(attributes).values({ name, slug }).returning();

  if (values && values.length) {
    const toInsert = values.map(v => ({ attributeId: inserted.id, value: v.value, slug: v.slug }));
    await db.insert(attributeValues).values(toInsert).execute();
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}

