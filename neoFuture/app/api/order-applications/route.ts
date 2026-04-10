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
      order_request_id, 
      farmer_id, 
      price_per_unit, 
      available_quantity,
      delivery_date,
      notes 
    } = body;

    // Validate required fields
    if (!order_request_id || !farmer_id || !price_per_unit || !available_quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if farmer already applied to this order request
    const { data: existingApplication } = await supabase
      .from('order_applications')
      .select('id')
      .eq('order_request_id', order_request_id)
      .eq('farmer_id', farmer_id)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this order request' },
        { status: 400 }
      );
    }

    // Get order request details to check if multiple farmers are allowed
    const { data: orderRequest, error: orderError } = await supabase
      .from('order_requests')
      .select('allow_multiple_farmers, status')
      .eq('id', order_request_id)
      .single();

    if (orderError || !orderRequest) {
      return NextResponse.json(
        { error: 'Order request not found' },
        { status: 404 }
      );
    }

    if (orderRequest.status !== 'open') {
      return NextResponse.json(
        { error: 'This order request is no longer open' },
        { status: 400 }
      );
    }

    // If multiple farmers are not allowed, check if someone already applied
    if (!orderRequest.allow_multiple_farmers) {
      const { data: existingApps } = await supabase
        .from('order_applications')
        .select('id')
        .eq('order_request_id', order_request_id);

      if (existingApps && existingApps.length > 0) {
        return NextResponse.json(
          { error: 'This order request only allows one farmer application' },
          { status: 400 }
        );
      }
    }

    // Insert order application
    const { data, error } = await supabase
      .from('order_applications')
      .insert({
        order_request_id,
        farmer_id,
        price_per_unit,
        available_quantity,
        delivery_date: delivery_date || null,
        notes: notes || '',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      application: data 
    });

  } catch (error) {
    console.error('Order application API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { application_id, status, buyer_id } = body;

    // Validate required fields
    if (!application_id || !status || !buyer_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify buyer owns this order request
    const { data: application, error: appError } = await supabase
      .from('order_applications')
      .select(`
        *,
        order_requests!inner (buyer_id)
      `)
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.order_requests.buyer_id !== buyer_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update application status
    const { data, error } = await supabase
      .from('order_applications')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', application_id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    // If accepted, check if order should be closed
    if (status === 'accepted') {
      // Get all accepted applications for this order request
      const { data: allApplications } = await supabase
        .from('order_applications')
        .select('available_quantity')
        .eq('order_request_id', application.order_request_id)
        .eq('status', 'accepted');

      // Get the order request details
      const { data: orderRequest } = await supabase
        .from('order_requests')
        .select('quantity, allow_multiple_farmers')
        .eq('id', application.order_request_id)
        .single();

      if (orderRequest && allApplications) {
        // Calculate total accepted quantity (including the current one)
        const totalAccepted = allApplications.reduce((sum, app) => sum + app.available_quantity, 0) + data.available_quantity;
        
        // Close order if:
        // 1. Multiple farmers not allowed (existing logic), OR
        // 2. Total accepted quantity meets or exceeds requested quantity
        if (!orderRequest.allow_multiple_farmers || totalAccepted >= orderRequest.quantity) {
          await supabase
            .from('order_requests')
            .update({ 
              status: 'closed',
              updated_at: new Date().toISOString()
            })
            .eq('id', application.order_request_id);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      application: data 
    });

  } catch (error) {
    console.error('Order application update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}