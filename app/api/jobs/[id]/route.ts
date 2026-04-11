import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/jobs/[id] — start job / end job early
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const body = await request.json();
    const { action, lister_id } = body;

    // Verify lister owns this job
    const { data: job, error: fetchErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (job.lister_id !== lister_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (action === 'start') {
      // Move accepted workers to working
      await supabase
        .from('job_applications')
        .update({ status: 'working', updated_at: new Date().toISOString() })
        .eq('job_id', jobId)
        .eq('status', 'accepted');

      const { data, error } = await supabase
        .from('jobs')
        .update({ status: 'in_work', updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, job: data });
    }

    if (action === 'end') {
      // Complete all working workers and trigger payment
      await supabase
        .from('job_applications')
        .update({ status: 'completed', payment_status: 'paid', updated_at: new Date().toISOString() })
        .eq('job_id', jobId)
        .eq('status', 'working');

      const { data, error } = await supabase
        .from('jobs')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, job: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] — remove job (lister only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);
    const { lister_id } = await request.json();

    const { data: job } = await supabase
      .from('jobs')
      .select('lister_id')
      .eq('id', jobId)
      .single();

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (job.lister_id !== lister_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    await supabase.from('job_applications').delete().eq('job_id', jobId);
    await supabase.from('jobs').delete().eq('id', jobId);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
