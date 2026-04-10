import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    // Get order with all related data
    const result = await client.query(
      `
      SELECT 
        o.*,
        buyer.id as buyer_id,
        buyer.name as buyer_name,
        buyer.email as buyer_email,
        seller.id as seller_id,
        seller.name as farmer_name,
        seller.email as farmer_email,
        p.id as product_id,
        p.name as product_name,
        p.price as product_price
      FROM orders o
      LEFT JOIN users buyer ON o.buyer_id = buyer.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users seller ON p.seller_id = seller.id
      WHERE o.id = $1
      `,
      [orderId]
    );

    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'Order not found'
      });
    }

    const order = result.rows[0];

    return NextResponse.json({
      found: true,
      order: order,
      validation: {
        hasOrder: true,
        hasBuyer: !!order.buyer_id,
        hasSeller: !!order.seller_id,
        hasProduct: !!order.product_id,
        hasBuyerEmail: !!order.buyer_email,
        hasSellerEmail: !!order.farmer_email,
        hasProductName: !!order.product_name,
        hasQuantity: !!order.quantity,
        hasPrice: !!order.product_price,
        canGenerateReceipt: !!(
          order.buyer_id &&
          order.seller_id &&
          order.product_id &&
          order.buyer_email &&
          order.farmer_email &&
          order.product_name &&
          order.quantity &&
          order.product_price
        )
      }
    });
  } catch (error: any) {
    console.error('Error debugging order:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
