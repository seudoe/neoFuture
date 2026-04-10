import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

// GET /api/tracking/[trackingCode] - Public endpoint for tracking page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingCode: string }> }
) {
  try {
    const { trackingCode } = await params;

    if (!trackingCode) {
      return NextResponse.json(
        { success: false, error: 'Tracking code is required' },
        { status: 400 }
      );
    }

    // Fetch order with tracking code
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        tracking_code,
        status,
        order_date,
        quantity,
        unit_price,
        total_price,
        delivery_address,
        product:products (
          id,
          name,
          category,
          photos
        ),
        seller:users!orders_seller_id_fkey (
          name,
          phone_number
        )
      `)
      .eq('tracking_code', trackingCode)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch tracking logs
    const { data: trackingLogs, error: logsError } = await supabaseClient
      .from('order_tracking_logs')
      .select('*')
      .eq('order_id', order.id)
      .order('timestamp', { ascending: true });

    if (logsError) {
      console.error('Error fetching tracking logs:', logsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking logs' },
        { status: 500 }
      );
    }

    // Return sanitized data (no sensitive user info)
    return NextResponse.json({
      success: true,
      tracking: {
        trackingCode: order.tracking_code,
        currentStatus: order.status,
        orderDate: order.order_date,
        quantity: order.quantity,
        totalPrice: order.total_price,
        deliveryAddress: order.delivery_address,
        product: {
          name: order.product?.name,
          category: order.product?.category,
          photo: order.product?.photos?.[0] || null
        },
        seller: {
          name: order.seller?.name,
          phone: order.seller?.phone_number
        },
        timeline: trackingLogs || []
      }
    });

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
