import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT - Update order status
export async function PUT(request: NextRequest) {
  try {
    // Extract ID from URL path
    const urlParts = request.url.split('/');
    const id = urlParts[urlParts.length - 1];
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select(`
        *,
        buyer:users!orders_buyer_id_fkey (
          id,
          name,
          email,
          phone_number
        ),
        seller:users!orders_seller_id_fkey (
          id,
          name,
          email,
          phone_number
        ),
        product:products (
          id,
          name,
          category,
          photos
        )
      `)
      .single();

    if (error) {
      console.error('Order update error:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      message: `Order ${status} successfully`
    });

  } catch (error) {
    console.error('Order update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}