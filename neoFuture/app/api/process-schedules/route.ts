import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { force = false } = body;
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Find schedules that need to be executed
    let query = supabase
      .from('order_schedules')
      .select('*')
      .eq('is_active', true);
    
    // If not forcing, only get schedules due today or earlier
    if (!force) {
      query = query.lte('next_execution_date', today);
    }
    
    const { data: schedules, error: schedulesError } = await query;

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: force ? 'No active schedules found' : 'No schedules due for processing',
        processed: 0,
        info: force ? 'All active schedules have been checked' : `Next scheduled execution dates are in the future`
      });
    }

    let processedCount = 0;
    const results = [];

    for (const schedule of schedules) {
      try {
        // Skip if not due and not forcing
        if (!force && schedule.next_execution_date > today) {
          results.push({
            schedule_id: schedule.id,
            success: false,
            error: 'Not due yet',
            skipped: true
          });
          continue;
        }
        
        // Calculate delivery date (schedule execution date + days_before_needed)
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + schedule.days_before_needed);
        
        // Create order request from schedule
        const { data: orderRequest, error: orderError } = await supabase
          .from('order_requests')
          .insert({
            buyer_id: schedule.buyer_id,
            product_name: schedule.product_name,
            quantity: schedule.quantity,
            by_date: deliveryDate.toISOString().split('T')[0],
            allow_multiple_farmers: schedule.allow_multiple_farmers,
            description: schedule.description + (schedule.description ? ' - ' : '') + 'Auto-Generated Order',
            max_price_per_unit: schedule.max_price_per_unit,
            status: 'open',
            is_scheduled: true,
            schedule_id: schedule.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) {
          console.error(`Error creating order request for schedule ${schedule.id}:`, orderError);
          results.push({
            schedule_id: schedule.id,
            success: false,
            error: orderError.message
          });
          continue;
        }

        // Calculate next execution date
        let nextExecutionDate = new Date(schedule.next_execution_date);
        
        if (schedule.schedule_type === 'daily') {
          nextExecutionDate.setDate(nextExecutionDate.getDate() + 1);
        } else if (schedule.schedule_type === 'weekly') {
          nextExecutionDate.setDate(nextExecutionDate.getDate() + 7);
        } else if (schedule.schedule_type === 'monthly') {
          // Move to next month, same day
          nextExecutionDate.setMonth(nextExecutionDate.getMonth() + 1);
          
          // Handle edge case where the day doesn't exist in the next month (e.g., Jan 31 -> Feb 31)
          if (nextExecutionDate.getDate() !== schedule.schedule_day) {
            // Set to last day of the month
            nextExecutionDate = new Date(nextExecutionDate.getFullYear(), nextExecutionDate.getMonth() + 1, 0);
          }
        }

        // Update schedule with next execution date
        const { error: updateError } = await supabase
          .from('order_schedules')
          .update({
            next_execution_date: nextExecutionDate.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`Error updating schedule ${schedule.id}:`, updateError);
          results.push({
            schedule_id: schedule.id,
            success: false,
            error: updateError.message
          });
          continue;
        }

        processedCount++;
        results.push({
          schedule_id: schedule.id,
          success: true,
          order_request_id: orderRequest.id,
          next_execution_date: nextExecutionDate.toISOString().split('T')[0]
        });

      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
        results.push({
          schedule_id: schedule.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} schedules`,
      processed: processedCount,
      total: schedules.length,
      results
    });

  } catch (error) {
    console.error('Process schedules API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check schedules without processing them
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: schedules, error } = await supabase
      .from('order_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution_date', today);

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      schedules_due: schedules?.length || 0,
      schedules: schedules || []
    });

  } catch (error) {
    console.error('Get schedules API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}