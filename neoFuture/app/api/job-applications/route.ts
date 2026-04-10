import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST — apply for a job
export async function POST(request: NextRequest) {
  try {
    const { job_id, worker_id } = await request.json();
    if (!job_id || !worker_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // 1. Check worker not already working on another job
    const { data: activeJob } = await supabase
      .from('job_applications')
      .select('id')
      .eq('worker_id', worker_id)
      .eq('status', 'working')
      .single();

    if (activeJob) return NextResponse.json({ error: 'You are currently working on another job' }, { status: 400 });

    // 2. Fetch job
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (job.status !== 'open') return NextResponse.json({ error: 'Job is no longer accepting applications' }, { status: 400 });

    // Block lister from applying to their own job
    if (job.lister_id === worker_id) return NextResponse.json({ error: 'You cannot apply to your own job' }, { status: 400 });
    // 3. Check deadline — auto-close if expired
    const today = new Date().toISOString().split('T')[0];
    if (today > job.registration_deadline) {
      await supabase
        .from('jobs')
        .update({ status: 'closed', fulfilled: false, updated_at: new Date().toISOString() })
        .eq('id', job_id);
      return NextResponse.json({ error: 'Registration deadline has passed. Job is now closed.' }, { status: 400 });
    }

    // 4. Count actual accepted applications (source of truth, not the counter)
    const { count: acceptedCount } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', job_id)
      .eq('status', 'accepted');

    if ((acceptedCount ?? 0) >= job.workers_required) {
      return NextResponse.json({ error: 'This job is already full' }, { status: 400 });
    }

    // 5. Check not already applied
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('worker_id', worker_id)
      .single();

    if (existing) return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 });

    const { data, error } = await supabase
      .from('job_applications')
      .insert({ job_id, worker_id, status: 'applied' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, application: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — accept or reject a worker (lister only)
export async function PUT(request: NextRequest) {
  try {
    const { application_id, job_id, lister_id, action } = await request.json();
    if (!application_id || !lister_id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Verify lister owns the job
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (!job || job.lister_id !== lister_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (action === 'accept') {
      // Count current accepted applications (source of truth)
      const { count: acceptedCount } = await supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', job_id)
        .eq('status', 'accepted');

      if ((acceptedCount ?? 0) >= job.workers_required) {
        return NextResponse.json({ error: 'Worker limit reached' }, { status: 400 });
      }

      await supabase
        .from('job_applications')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', application_id);

      const newAcceptedCount = (acceptedCount ?? 0) + 1;

      // If slots are now full, close the job automatically
      const newStatus = newAcceptedCount >= job.workers_required ? 'closed' : 'open';
      await supabase
        .from('jobs')
        .update({ workers_accepted: newAcceptedCount, status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', job_id);

    } else if (action === 'reject') {
      await supabase
        .from('job_applications')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', application_id);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
