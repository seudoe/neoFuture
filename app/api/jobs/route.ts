import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/jobs?status=open | ?lister_id=x | ?worker_id=x
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const lister_id = searchParams.get('lister_id');
    const worker_id = searchParams.get('worker_id');

    // Auto-close jobs past their registration deadline
    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('jobs')
      .update({ status: 'closed', fulfilled: false, updated_at: new Date().toISOString() })
      .eq('status', 'open')
      .lt('registration_deadline', today);

    if (worker_id) {
      // Get jobs a worker has applied to
      const { data, error } = await supabase
        .from('job_applications')
        .select(`*, jobs(*, users!jobs_lister_id_fkey(name, phone_number))`)
        .eq('worker_id', worker_id)
        .order('applied_at', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ applications: data });
    }

    let query = supabase
      .from('jobs')
      .select(`
        *,
        users!jobs_lister_id_fkey(name, phone_number),
        job_applications(id, worker_id, status, payment_status)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (lister_id) query = query.eq('lister_id', lister_id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // For browse (status=open), also auto-close any jobs where accepted == required
    // and filter them out of results
    let jobs = data || [];
    if (status === 'open') {
      const toClose: number[] = [];
      jobs = jobs.filter((job: any) => {
        const acceptedCount = (job.job_applications || []).filter((a: any) => a.status === 'accepted').length;
        if (acceptedCount >= job.workers_required) {
          toClose.push(job.id);
          return false; // remove from results
        }
        return true;
      });
      // Auto-close full jobs in DB
      if (toClose.length > 0) {
        await supabase
          .from('jobs')
          .update({ status: 'closed', updated_at: new Date().toISOString() })
          .in('id', toClose);
      }
    }

    return NextResponse.json({ jobs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/jobs — create job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lister_id, title, description, location,
      start_date, end_date, start_time, end_time,
      workers_required, fixed_pay, tools_required,
      tools_provided, registration_deadline
    } = body;

    if (!lister_id || !title || !location || !start_date || !end_date || !start_time || !end_time || !fixed_pay || !registration_deadline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        lister_id, title, description, location,
        start_date, end_date, start_time, end_time,
        workers_required: workers_required || 1,
        fixed_pay, tools_required, tools_provided: tools_provided || false,
        registration_deadline, status: 'open'
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, job: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
