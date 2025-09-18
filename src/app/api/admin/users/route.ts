import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, desc, like, or } from 'drizzle-orm';

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // TODO: Add proper authentication
    // const session = await auth()
    // if (!session?.user || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Query users
    let allUsers;

    if (search) {
      allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);
    }

    // Get total count
    const totalQuery = search
      ? await db
          .select()
          .from(users)
          .where(or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)))
      : await db.select().from(users);

    return NextResponse.json({
      users: allUsers,
      pagination: {
        page,
        limit,
        total: totalQuery.length,
        pages: Math.ceil(totalQuery.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;
    const validatedData = updateUserSchema.parse(updateData);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user
    const updateFields: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateFields.name = validatedData.name;
    if (validatedData.role !== undefined) updateFields.role = validatedData.role;

    const [updatedUser] = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
