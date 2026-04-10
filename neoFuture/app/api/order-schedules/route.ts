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
      allow_multiple_farmers, 
      description,
      max_price_per_unit,
      schedule_type,
      schedule_day,
      days_before_needed
    } = body;

    // Validate required fields
    if (!buyer_id || !product_name || !quantity || !schedule_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate next execution date based on schedule type
    let nextExecutionDate = new Date();
    
    if (schedule_type === 'monthly') {
      if (!schedule_day || schedule_day < 1 || schedule_day > 31) {
        return NextResponse.json(
          { error: 'Invalid schedule_day for monthly schedule (must be 1-31)' },
          { status: 400 }
        );
      }
      
      // Set to next occurrence of the specified day
      const currentDate = new Date();
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), schedule_day);
      
      // If the target date has passed this month, move to next month
      if (targetDate <= currentDate) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
      
      nextExecutionDate = targetDate;
    } else if (schedule_type === 'weekly') {
      if (schedule_day === null || schedule_day < 0 || schedule_day > 6) {
        return NextResponse.json(
          { error: 'Invalid schedule_day for weekly schedule (must be 0-6, where 0=Sunday)' },
          { status: 400 }
        );
      }
      
      // Set to next occurrence of the specified day of week
      const currentDate = new Date();
      const daysUntilTarget = (schedule_day - currentDate.getDay() + 7) % 7;
      nextExecutionDate.setDate(currentDate.getDate() + (daysUntilTarget || 7));
    } else if (schedule_type === 'daily') {
      // Set to tomorrow
      nextExecutionDate.setDate(nextExecutionDate.getDate() + 1);
    }

    // Insert order schedule
    const { data, error } = await supabase
      .from('order_schedules')
      .insert({
        buyer_id,
        product_name,
        quantity,
        allow_multiple_farmers: allow_multiple_farmers || false,
        description: description || '',
        max_price_per_unit: max_price_per_unit || null,
        schedule_type,
        schedule_day: schedule_day || null,
        days_before_needed: days_before_needed || 7,
        is_active: true,
        next_execution_date: nextExecutionDate.toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create order schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      schedule: data 
    });

  } catch (error) {
    console.error('Order schedule API error:', error);
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

    if (!buyer_id) {
      return NextResponse.json(
        { error: 'Missing buyer_id parameter' },
        { status: 400 }
      );
    }

    // Get schedules for this buyer
    const { data, error } = await supabase
      .from('order_schedules')
      .select('*')
      .eq('buyer_id', buyer_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order schedules' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedules: data });

  } catch (error) {
    console.error('Order schedule GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      schedule_id, 
      buyer_id, 
      is_active,
      product_name,
      quantity,
      allow_multiple_farmers,
      description,
      max_price_per_unit,
      schedule_type,
      schedule_day,
      days_before_needed
    } = body;

    // Validate required fields
    if (!schedule_id || !buyer_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify buyer owns this schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('order_schedules')
      .select('buyer_id')
      .eq('id', schedule_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    if (schedule.buyer_id !== buyer_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // If only updating is_active (pause/activate)
    if (is_active !== undefined && !product_name) {
      updateData.is_active = is_active;
    } else {
      // Full schedule update
      if (product_name) updateData.product_name = product_name;
      if (quantity) updateData.quantity = quantity;
      if (allow_multiple_farmers !== undefined) updateData.allow_multiple_farmers = allow_multiple_farmers;
      if (description !== undefined) updateData.description = description;
      if (max_price_per_unit !== undefined) updateData.max_price_per_unit = max_price_per_unit;
      if (schedule_type) updateData.schedule_type = schedule_type;
      if (schedule_day !== undefined) updateData.schedule_day = schedule_day;
      if (days_before_needed) updateData.days_before_needed = days_before_needed;

      // Recalculate next execution date if schedule details changed
      if (schedule_type) {
        let nextExecutionDate = new Date();
        
        if (schedule_type === 'monthly') {
          if (!schedule_day || schedule_day < 1 || schedule_day > 31) {
            return NextResponse.json(
              { error: 'Invalid schedule_day for monthly schedule (must be 1-31)' },
              { status: 400 }
            );
          }
          
          const currentDate = new Date();
          const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), schedule_day);
          
          if (targetDate <= currentDate) {
            targetDate.setMonth(targetDate.getMonth() + 1);
          }
          
          nextExecutionDate = targetDate;
        } else if (schedule_type === 'weekly') {
          if (schedule_day === null || schedule_day < 0 || schedule_day > 6) {
            return NextResponse.json(
              { error: 'Invalid schedule_day for weekly schedule (must be 0-6, where 0=Sunday)' },
              { status: 400 }
            );
          }
          
          const currentDate = new Date();
          const daysUntilTarget = (schedule_day - currentDate.getDay() + 7) % 7;
          nextExecutionDate.setDate(currentDate.getDate() + (daysUntilTarget || 7));
        } else if (schedule_type === 'daily') {
          nextExecutionDate.setDate(nextExecutionDate.getDate() + 1);
        }

        updateData.next_execution_date = nextExecutionDate.toISOString().split('T')[0];
      }
    }

    // Update schedule
    const { data, error } = await supabase
      .from('order_schedules')
      .update(updateData)
      .eq('id', schedule_id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      schedule: data 
    });

  } catch (error) {
    console.error('Order schedule update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schedule_id = searchParams.get('schedule_id');
    const buyer_id = searchParams.get('buyer_id');

    if (!schedule_id || !buyer_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify buyer owns this schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('order_schedules')
      .select('buyer_id')
      .eq('id', schedule_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    if (schedule.buyer_id !== parseInt(buyer_id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete schedule
    const { error } = await supabase
      .from('order_schedules')
      .delete()
      .eq('id', schedule_id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    });

  } catch (error) {
    console.error('Order schedule delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}