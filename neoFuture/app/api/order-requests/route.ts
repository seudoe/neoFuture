import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      buyer_id, 
      product_name, 
      quantity, 
      by_date, 
      allow_multiple_farmers, 
      description,
      max_price_per_unit,
      is_scheduled,
      schedule_id
    } = body;

    // Validate required fields
    if (!buyer_id || !product_name || !quantity || !by_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert order request
    const { data, error } = await supabase
      .from('order_requests')
      .insert({
        buyer_id,
        product_name,
        quantity,
        by_date,
        allow_multiple_farmers: allow_multiple_farmers || false,
        description: description || '',
        max_price_per_unit: max_price_per_unit || null,
        status: 'open',
        is_scheduled: is_scheduled || false,
        schedule_id: schedule_id || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create order request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      orderRequest: data 
    });

  } catch (error) {
    console.error('Order request API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyer_id = searchParams.get('buyer_id');
    const farmer_id = searchParams.get('farmer_id');

    if (buyer_id) {
      // Get order requests created by this buyer
      const { data, error } = await supabase
        .from('order_requests')
        .select(`
          *,
          order_applications (
            id,
            farmer_id,
            price_per_unit,
            available_quantity,
            delivery_date,
            notes,
            status,
            users!farmer_id (name, phone_number)
          )
        `)
        .eq('buyer_id', buyer_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch order requests' },
          { status: 500 }
        );
      }

      return NextResponse.json({ orderRequests: data });
    }

    if (farmer_id) {
      // Get open order requests for farmers to apply to
      const { data, error } = await supabase
        .from('order_requests')
        .select(`
          id,
          buyer_id,
          product_name,
          quantity,
          by_date,
          allow_multiple_farmers,
          description,
          max_price_per_unit,
          status,
          created_at,
          is_scheduled,
          schedule_id,
          users!buyer_id (name, phone_number),
          order_applications!left (
            id,
            farmer_id,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch order requests' },
          { status: 500 }
        );
      }

      return NextResponse.json({ orderRequests: data });
    }

    return NextResponse.json(
      { error: 'Missing buyer_id or farmer_id parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Order request GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}