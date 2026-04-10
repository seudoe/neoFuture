import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch user's orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType'); // 'buyer' or 'seller'

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'User ID and user type are required' },
        { status: 400 }
      );
    }

    const column = userType === 'buyer' ? 'buyer_id' : 'seller_id';

    const { data: orders, error } = await supabase
      .from('orders')
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
      .eq(column, parseInt(userId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orders: orders || []
    });

  } catch (error) {
    console.error('Orders GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const {
      buyerId,
      sellerId,
      productId,
      quantity,
      unitPrice,
      totalPrice,
      deliveryAddress,
      notes
    } = await request.json();

    if (!buyerId || !sellerId || !productId || !quantity || !unitPrice || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if product has enough stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        delivery_address: deliveryAddress,
        notes,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Update product quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: product.quantity - quantity })
      .eq('id', productId);

    if (updateError) {
      console.error('Product update error:', updateError);
      // Note: In a real app, you'd want to rollback the order creation here
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Orders POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}