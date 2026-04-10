import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

// POST /api/tracking/log - Add tracking log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, updatedBy, updatedByType, notes, location } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Insert tracking log
    const { data: log, error: logError } = await supabaseClient
      .from('order_tracking_logs')
      .insert({
        order_id: orderId,
        status,
        timestamp: new Date().toISOString(),
        updated_by: updatedBy || null,
        updated_by_type: updatedByType || 'system',
        notes: notes || null,
        location: location || null
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating tracking log:', logError);
      return NextResponse.json(
        { success: false, error: 'Failed to create tracking log' },
        { status: 500 }
      );
    }

    // Update order status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      log
    });

  } catch (error) {
    console.error('Error in tracking log API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/tracking/log?orderId=123 - Get tracking logs for an order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const { data: logs, error } = await supabaseClient
      .from('order_tracking_logs')
      .select('*')
      .eq('order_id', orderId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching tracking logs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || []
    });

  } catch (error) {
    console.error('Error in tracking log API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
