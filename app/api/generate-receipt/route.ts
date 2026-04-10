import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateReceiptPDF } from '@/lib/receiptGenerator';
import { uploadReceiptToSupabase, createReceiptsBucket } from '@/lib/supabaseStorage';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    console.log('Generate receipt request for order:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Ensure bucket exists
    const bucketResult = await createReceiptsBucket();
    if (!bucketResult.success) {
      console.error('Failed to ensure bucket exists:', bucketResult.error);
      // Continue anyway - bucket might exist but we can't list it
    }

    const client = await pool.connect();

    // Check if receipt already generated
    const checkQuery = await client.query(
      'SELECT receipt_generated, receipt_url FROM orders WHERE id = $1',
      [orderId]
    );

    if (checkQuery.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = checkQuery.rows[0];

    // If receipt already exists, return existing URL
    if (order.receipt_generated && order.receipt_url) {
      console.log('Receipt already exists:', order.receipt_url);
      client.release();
      return NextResponse.json({
        success: true,
        receiptUrl: order.receipt_url,
        message: 'Receipt already exists',
      });
    }

    // Fetch complete order details with buyer, farmer, and products
    console.log('Fetching order details...');
    const orderQuery = await client.query(
      `
      SELECT 
        o.id,
        o.created_at as order_date,
        o.status,
        o.total_price as total_amount,
        o.unit_price,
        o.tracking_code,
        o.ordered_quantity,
        o.delivered_quantity,
        o.wasted_quantity,
        o.original_amount,
        o.adjusted_amount,
        buyer.name as buyer_name,
        buyer.email as buyer_email,
        seller.name as farmer_name,
        seller.email as farmer_email,
        p.name as product_name,
        o.quantity
      FROM orders o
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN products p ON o.product_id = p.id
      JOIN users seller ON p.seller_id = seller.id
      WHERE o.id = $1
      `,
      [orderId]
    );

    if (orderQuery.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { success: false, error: 'Order details not found' },
        { status: 404 }
      );
    }

    const orderData = orderQuery.rows[0];
    console.log('Order data fetched:', { 
      orderId: orderData.id, 
      buyer: orderData.buyer_name, 
      farmer: orderData.farmer_name,
      hasWastage: orderData.wasted_quantity > 0
    });

    // Prepare receipt data
    const receiptData = {
      orderId: orderData.id,
      orderDate: orderData.order_date,
      deliveryDate: orderData.status === 'delivered' ? new Date().toISOString() : undefined,
      status: orderData.status,
      buyerName: orderData.buyer_name,
      buyerEmail: orderData.buyer_email,
      farmerName: orderData.farmer_name,
      farmerEmail: orderData.farmer_email,
      products: [
        {
          name: orderData.product_name,
          quantity: orderData.delivered_quantity || orderData.ordered_quantity || orderData.quantity,
          price: parseFloat(orderData.unit_price),
        },
      ],
      totalAmount: orderData.adjusted_amount ? parseFloat(orderData.adjusted_amount) : parseFloat(orderData.total_amount),
      trackingCode: orderData.tracking_code,
      // Wastage fields
      orderedQuantity: orderData.ordered_quantity,
      deliveredQuantity: orderData.delivered_quantity,
      wastedQuantity: orderData.wasted_quantity || 0,
      originalAmount: orderData.original_amount ? parseFloat(orderData.original_amount) : parseFloat(orderData.total_amount),
      adjustedAmount: orderData.adjusted_amount ? parseFloat(orderData.adjusted_amount) : parseFloat(orderData.total_amount),
    };

    console.log('Generating PDF...');
    // Generate PDF
    const pdfBlob = generateReceiptPDF(receiptData);
    console.log('PDF generated, size:', pdfBlob.size);

    console.log('Uploading to Supabase...');
    // Upload to Supabase
    const uploadResult = await uploadReceiptToSupabase(orderId, pdfBlob);

    if (!uploadResult.success) {
      client.release();
      console.error('Upload failed:', uploadResult.error);
      return NextResponse.json(
        { success: false, error: uploadResult.error || 'Failed to upload receipt' },
        { status: 500 }
      );
    }

    console.log('Upload successful, updating database...');
    // Update order with receipt URL
    await client.query(
      `
      UPDATE orders 
      SET receipt_url = $1, 
          receipt_generated = TRUE, 
          receipt_generated_at = NOW()
      WHERE id = $2
      `,
      [uploadResult.url, orderId]
    );

    client.release();

    console.log('Receipt generation complete:', uploadResult.url);

    return NextResponse.json({
      success: true,
      receiptUrl: uploadResult.url,
      message: 'Receipt generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating receipt:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}
