/**
 * GET /api/recommendations?buyer_id=<id>
 *
 * Returns ALL active products with a recommendation score attached,
 * so the client can sort by score, price, or date freely.
 *
 * Scoring (no ML, pure affinity):
 *   +3 × frequency  — category matches a previously ordered category
 *   +2              — price within ±30% of buyer's avg spend in that category
 *   +1              — seller has been ordered from before (familiarity)
 *
 * Also returns:
 *   best_prices     — cheapest active product per ordered category
 *   ordered_categories
 *   has_history     — false when buyer has no order history (scores will all be 0)
 *   score_debug     — per-product breakdown so you can verify the algorithm is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const buyerId = searchParams.get('buyer_id');

  if (!buyerId) {
    return NextResponse.json({ error: 'buyer_id is required' }, { status: 400 });
  }

  try {
    // ── 1. Buyer's order history ─────────────────────────────────────────────
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select(`
        id, seller_id,
        product:products ( id, name, category, price_single )
      `)
      .eq('buyer_id', parseInt(buyerId))
      .in('status', ['completed', 'delivered', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(30);

    if (ordersErr) throw ordersErr;

    // ── 2. Build affinity maps ───────────────────────────────────────────────
    const categoryCount: Record<string, number> = {};
    const categoryPrices: Record<string, number[]> = {};
    const knownSellers = new Set<number>();

    for (const order of orders || []) {
      const cat: string = (order.product as any)?.category ?? 'unknown';
      const price: number = (order.product as any)?.price_single ?? 0;
      categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
      (categoryPrices[cat] ??= []).push(price);
      if (order.seller_id) knownSellers.add(order.seller_id);
    }

    const categoryAvgPrice: Record<string, number> = {};
    for (const [cat, prices] of Object.entries(categoryPrices)) {
      categoryAvgPrice[cat] = prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    const hasHistory = Object.keys(categoryCount).length > 0;

    // ── 3. All active products ───────────────────────────────────────────────
    const { data: allProducts, error: prodErr } = await supabase
      .from('products')
      .select(`*, users!products_seller_id_fkey (name, phone_number)`)
      .eq('status', 'active')
      .gt('quantity', 0)
      .order('created_at', { ascending: false });

    if (prodErr) throw prodErr;

    // ── 4. Score every product ───────────────────────────────────────────────
    const scored = (allProducts || []).map((p: any) => {
      let score = 0;
      const reasons: string[] = [];

      if (categoryCount[p.category]) {
        const pts = 3 * categoryCount[p.category];
        score += pts;
        reasons.push(`Category match ×${categoryCount[p.category]} (+${pts})`);
      }

      const avg = categoryAvgPrice[p.category];
      if (avg) {
        if (p.price_single >= avg * 0.7 && p.price_single <= avg * 1.3) {
          score += 2;
          reasons.push(`Price within range of your avg ₹${avg.toFixed(0)} (+2)`);
        }
      }

      if (knownSellers.has(p.seller_id)) {
        score += 1;
        reasons.push('Familiar seller (+1)');
      }

      return {
        ...p,
        seller_name: p.users?.name,
        seller_phone: p.users?.phone_number,
        rec_score: score,
        rec_reasons: reasons,   // visible in UI so buyer can see why it's recommended
      };
    });

    // ── 5. Best price per ordered category ──────────────────────────────────
    const bestPrices: Record<string, any> = {};
    for (const cat of Object.keys(categoryCount)) {
      const cheapest = scored
        .filter((p: any) => p.category === cat)
        .sort((a: any, b: any) => a.price_single - b.price_single)[0];
      if (cheapest) bestPrices[cat] = cheapest;
    }

    return NextResponse.json({
      products: scored,           // ALL products with scores — client sorts
      best_prices: bestPrices,
      ordered_categories: Object.keys(categoryCount),
      category_stats: Object.entries(categoryCount).map(([cat, count]) => ({
        category: cat,
        times_ordered: count,
        avg_price: categoryAvgPrice[cat]?.toFixed(2),
      })),
      has_history: hasHistory,
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
