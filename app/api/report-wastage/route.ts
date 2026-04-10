import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { 
      orderId, 
      buyerId, 
      deliveredQuantity, 
      wastedQuantity, 
      reason,
      photoUrls 
    } = await request.json();

    console.log('Wastage report received:', { 
      orderId, 
      buyerId, 
      deliveredQuantity, 
      wastedQuantity 
    });

    // Validation
    if (!orderId || !buyerId) {
      return NextResponse.json(
        { success: false, error: 'Order ID and Buyer ID are required' },
        { status: 400 }
      );
    }

    if (deliveredQuantity < 0 || wastedQuantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantities cannot be negative' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get order details
      const orderResult = await client.query(
        `SELECT 
          o.id, 
          o.ordered_quantity,
          o.quantity,
          o.unit_price, 
          o.buyer_id,
          o.verification_status,
          o.status
        FROM orders o
        WHERE o.id = $1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      const order = orderResult.rows[0];
      
      // Use ordered_quantity if available, otherwise use quantity
      const actualOrderedQty = order.ordered_quantity || order.quantity;
      
      // If ordered_quantity is NULL, update it now
      if (!order.ordered_quantity) {
        await client.query(
          `UPDATE orders 
          SET ordered_quantity = quantity,
              original_amount = total_price,
              adjusted_amount = total_price
          WHERE id = $1`,
          [orderId]
        );
      }

      // Verify buyer
      if (order.buyer_id !== buyerId) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Only the buyer can report wastage' },
          { status: 403 }
        );
      }

      // Check if already verified
      if (order.verification_status === 'verified') {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { success: false, error: 'Order already verified. Cannot modify report.' },
          { status: 400 }
        );
      }

      // Validate quantities
      const totalQuantity = deliveredQuantity + wastedQuantity;
      if (totalQuantity > actualOrderedQty) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { 
            success: false, 
            error: `Total quantity (${totalQuantity}) exceeds ordered quantity (${actualOrderedQty})` 
          },
          { status: 400 }
        );
      }

      // Calculate adjusted amount
      const adjustedAmount = deliveredQuantity * parseFloat(order.unit_price);
      const originalAmount = actualOrderedQty * parseFloat(order.unit_price);

      // Insert or update wastage report
      await client.query(
        `INSERT INTO order_wastage_reports 
          (order_id, reported_by, delivered_quantity, wasted_quantity, reason, photo_urls)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (order_id) 
        DO UPDATE SET
          delivered_quantity = $3,
          wasted_quantity = $4,
          reason = $5,
          photo_urls = $6,
          created_at = NOW()`,
        [orderId, buyerId, deliveredQuantity, wastedQuantity, reason, photoUrls || []]
      );

      // Update order
      await client.query(
        `UPDATE orders 
        SET 
          delivered_quantity = $1,
          wasted_quantity = $2,
          original_amount = $3,
          adjusted_amount = $4,
          verification_status = 'verified',
          status = 'delivered',
          updated_at = NOW()
        WHERE id = $5`,
        [deliveredQuantity, wastedQuantity, originalAmount, adjustedAmount, orderId]
      );

      // If there's wastage, regenerate receipt
      if (wastedQuantity > 0) {
        // Mark receipt for regeneration
        await client.query(
          `UPDATE orders 
          SET receipt_generated = FALSE, 
              receipt_url = NULL 
          WHERE id = $1`,
          [orderId]
        );
      }

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        message: 'Wastage report submitted successfully',
        data: {
          orderId,
          deliveredQuantity,
          wastedQuantity,
          originalAmount,
          adjustedAmount,
          savings: originalAmount - adjustedAmount
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Error reporting wastage:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to report wastage' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch wastage report for an order
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

    const result = await client.query(
      `SELECT 
        wr.*,
        u.name as reporter_name,
        u.email as reporter_email
      FROM order_wastage_reports wr
      JOIN users u ON wr.reported_by = u.id
      WHERE wr.order_id = $1`,
      [orderId]
    );

    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({
        found: false,
        report: null
      });
    }

    return NextResponse.json({
      found: true,
      report: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error fetching wastage report:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
