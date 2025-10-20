import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, users, orders, files } from '@/lib/db/schema';
import { eq, gte, count, sum, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Get current month start date
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get stats in parallel
    const [
      totalProductsResult,
      totalUsersResult,
      ordersThisMonthResult,
      totalFilesResult,
      revenueThisMonthResult,
      recentOrdersResult,
    ] = await Promise.all([
      // Total products
      db.select({ count: count() }).from(products).where(eq(products.isActive, true)),

      // Total users
      db.select({ count: count() }).from(users),

      // Orders this month
      db.select({ count: count() }).from(orders).where(gte(orders.createdAt, currentMonthStart)),

      // Total files
      db.select({ count: count() }).from(files),

      // Revenue this month
      db
        .select({
          total: sum(orders.total),
        })
        .from(orders)
        .where(and(gte(orders.createdAt, currentMonthStart), eq(orders.status, 'completed'))),

      // Recent orders (last 10) - fetch raw status and data for admin UI
      db
        .select({
          id: orders.id,
          customerName: users.name,
          customerEmail: users.email,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt))
        .limit(10),
    ]);

    // Calculate downloads this month (assuming each completed order = 1 download)
    const downloadsThisMonth = ordersThisMonthResult[0]?.count || 0;

    const stats = {
      totalProdutos: totalProductsResult[0]?.count || 0,
      totalClientes: totalUsersResult[0]?.count || 0,
      pedidosMes: ordersThisMonthResult[0]?.count || 0,
      arquivosUpload: totalFilesResult[0]?.count || 0,
      receitaMes: parseFloat(revenueThisMonthResult[0]?.total || '0'),
      downloadsMes: downloadsThisMonth,
      recentOrders: recentOrdersResult.map(order => ({
        id: order.id,
        customerName: order.customerName || order.customerEmail || 'Cliente',
        total: parseFloat(order.total),
        // Normalize status to canonical values expected by the admin UI
        status: (order.status || '').toLowerCase(),
        createdAt: order.createdAt,
      })),
    };

    return NextResponse.json(stats);
  } catch {
    // Return mock data on error to prevent dashboard breaking
    return NextResponse.json({
      totalProdutos: 0,
      totalClientes: 0,
      pedidosMes: 0,
      arquivosUpload: 0,
      receitaMes: 0,
      downloadsMes: 0,
      recentOrders: [],
    });
  }
}
