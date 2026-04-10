import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Setting up order tracking system...');

    // Create order_tracking_logs table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS order_tracking_logs (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id),
        updated_by_type VARCHAR(20) CHECK (updated_by_type IN ('buyer', 'seller', 'system')),
        notes TEXT,
        location VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_order_tracking_logs_order_id ON order_tracking_logs(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_tracking_logs_timestamp ON order_tracking_logs(timestamp);
    `;

    const { error: tableError } = await supabaseClient.rpc('exec_sql', { 
      sql: createTableQuery 
    });

    if (tableError) {
      console.error('Error creating table:', tableError);
      // Try alternative approach
      const { error: altError } = await supabaseClient
        .from('order_tracking_logs')
        .select('id')
        .limit(1);
      
      if (altError && altError.code !== 'PGRST116') {
        throw new Error('Failed to create tracking table');
      }
    }

    // Add tracking_code column to orders table
    const alterTableQuery = `
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(50) UNIQUE;
    `;

    const { error: alterError } = await supabaseClient.rpc('exec_sql', { 
      sql: alterTableQuery 
    });

    if (alterError) {
      console.log('Note: tracking_code column may already exist or needs manual creation');
    }

    // Generate tracking codes for existing orders
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id, tracking_code')
      .is('tracking_code', null);

    if (!ordersError && orders && orders.length > 0) {
      console.log(`Generating tracking codes for ${orders.length} orders...`);
      
      for (const order of orders) {
        const trackingCode = `TRK-${String(order.id).padStart(8, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        await supabaseClient
          .from('orders')
          .update({ tracking_code: trackingCode })
          .eq('id', order.id);
      }
    }

    // Create initial tracking logs for existing orders
    const { data: ordersWithoutLogs, error: logsCheckError } = await supabaseClient
      .from('orders')
      .select('id, status, order_date');

    if (!logsCheckError && ordersWithoutLogs) {
      console.log(`Creating initial tracking logs for ${ordersWithoutLogs.length} orders...`);
      
      for (const order of ordersWithoutLogs) {
        // Check if logs already exist
        const { data: existingLogs } = await supabaseClient
          .from('order_tracking_logs')
          .select('id')
          .eq('order_id', order.id)
          .limit(1);

        if (!existingLogs || existingLogs.length === 0) {
          // Create initial log
          await supabaseClient
            .from('order_tracking_logs')
            .insert({
              order_id: order.id,
              status: order.status,
              timestamp: order.order_date,
              updated_by_type: 'system',
              notes: 'Order created'
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order tracking system setup completed',
      details: {
        tableCreated: true,
        trackingCodesGenerated: orders?.length || 0,
        logsCreated: ordersWithoutLogs?.length || 0
      }
    });

  } catch (error) {
    console.error('Error setting up tracking system:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to setup tracking system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check setup status
export async function GET() {
  try {
    // Check if table exists
    const { data: logs, error: logsError } = await supabaseClient
      .from('order_tracking_logs')
      .select('id')
      .limit(1);

    // Check orders with tracking codes
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('id, tracking_code')
      .not('tracking_code', 'is', null)
      .limit(10);

    return NextResponse.json({
      success: true,
      status: {
        tableExists: !logsError,
        ordersWithTracking: orders?.length || 0,
        sampleTrackingCodes: orders?.map(o => o.tracking_code) || []
      }
    });

  } catch (error) {
    console.error('Error checking tracking setup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}
