// app/api/admin/analytics/revenue/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const db = getDb();
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all'; // '7d', '30d', 'all'

    let dateClause = '';
    if (range === '7d') dateClause = "AND o.created_at >= NOW() - INTERVAL '7 days'";
    if (range === '30d') dateClause = "AND o.created_at >= NOW() - INTERVAL '30 days'";

    // Aggregated comparison query
    const statsQuery = `
      SELECT 
        COALESCE(o.channel, 'ONLINE') AS channel,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(o.subtotal), 0) AS gross_sales,
        COALESCE(SUM(o.discount_amount), 0) AS total_discounts,
        COALESCE(SUM(o.shipping_charge), 0) AS shipping_collected,
        COALESCE(SUM(o.final_payable), 0) AS net_revenue,
        COALESCE(SUM(oi.cost_price * oi.quantity), 0) AS total_cogs,
        COALESCE(SUM(o.final_payable) - SUM(oi.cost_price * oi.quantity), 0) AS net_profit
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status NOT IN ('CANCELLED', 'RETURNED')
      ${dateClause}
      GROUP BY COALESCE(o.channel, 'ONLINE');
    `;

    const statsRes = await db.query(statsQuery);

    let online = { total_orders: 0, gross_sales: 0, total_discounts: 0, shipping_collected: 0, net_revenue: 0, total_cogs: 0, net_profit: 0 };
    let offline = { total_orders: 0, gross_sales: 0, total_discounts: 0, shipping_collected: 0, net_revenue: 0, total_cogs: 0, net_profit: 0 };

    statsRes.rows.forEach((row) => {
      const data = {
        total_orders: Number(row.total_orders),
        gross_sales: Number(row.gross_sales),
        total_discounts: Number(row.total_discounts),
        shipping_collected: Number(row.shipping_collected),
        net_revenue: Number(row.net_revenue),
        total_cogs: Number(row.total_cogs),
        net_profit: Number(row.net_profit),
      };
      if (row.channel === 'OFFLINE') offline = data;
      else online = data;
    });

    const combined = {
      total_orders: online.total_orders + offline.total_orders,
      gross_sales: online.gross_sales + offline.gross_sales,
      total_discounts: online.total_discounts + offline.total_discounts,
      shipping_collected: online.shipping_collected + offline.shipping_collected,
      net_revenue: online.net_revenue + offline.net_revenue,
      total_cogs: online.total_cogs + offline.total_cogs,
      net_profit: online.net_profit + offline.net_profit,
      margin_pct:
        online.net_revenue + offline.net_revenue > 0
          ? Math.round(
              ((online.net_profit + offline.net_profit) / (online.net_revenue + offline.net_revenue)) * 100
            )
          : 0,
    };

    return NextResponse.json({ online, offline, combined });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}