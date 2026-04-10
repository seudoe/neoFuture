import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const sql = `
    -- Jobs table
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      lister_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      workers_required INTEGER NOT NULL DEFAULT 1,
      workers_accepted INTEGER NOT NULL DEFAULT 0,
      fixed_pay NUMERIC(10,2) NOT NULL,
      tools_required TEXT,
      tools_provided BOOLEAN NOT NULL DEFAULT false,
      registration_deadline DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_work','closed')),
      fulfilled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Job applications table
    CREATE TABLE IF NOT EXISTS job_applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      worker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','accepted','rejected','working','completed')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid')),
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(job_id, worker_id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_jobs_lister ON jobs(lister_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_job_apps_job ON job_applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_apps_worker ON job_applications(worker_id);
    CREATE INDEX IF NOT EXISTS idx_job_apps_status ON job_applications(status);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

  // Try direct approach if rpc not available
  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      sql,
      message: 'Run the SQL manually in Supabase SQL editor'
    }, { status: 200 });
  }

  return NextResponse.json({ success: true, message: 'Jobs tables created' });
}
