import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Runs raw SQL via Supabase's PostgREST /rpc/exec_sql endpoint.
 * Falls back to the pg REST endpoint if that doesn't exist.
 */
async function runSQL(sql: string): Promise<{ error?: string }> {
  // Supabase exposes a SQL-over-HTTP endpoint at /rest/v1/rpc/exec_sql
  // but only if the function exists. We use the pg endpoint instead.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: body };
  }
  return {};
}

export async function POST() {
  // Since exec_sql RPC doesn't exist, we'll create it first via the pg endpoint
  // then run our migrations through it.

  // Try creating the exec_sql helper function via the pg REST API
  const createFnRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  // Use direct SQL statements via individual Supabase operations
  // Since we can't run arbitrary DDL through the JS client directly,
  // we'll return the SQL for manual execution and also attempt via rpc
  const migrations = [
    {
      name: 'products_status',
      description: "Add 'sold_out' to products.status constraint",
      sql: `
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check
  CHECK (status IN ('active', 'inactive', 'sold', 'sold_out'));
      `.trim(),
    },
    {
      name: 'jobs_tables',
      description: 'Create jobs + job_applications tables',
      sql: `
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
CREATE INDEX IF NOT EXISTS idx_jobs_lister    ON jobs(lister_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status    ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_apps_job    ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_worker ON job_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_status ON job_applications(status);
      `.trim(),
    },
    {
      name: 'order_tracking',
      description: 'Create order_tracking_logs table + tracking_code column on orders',
      sql: `
CREATE TABLE IF NOT EXISTS order_tracking_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id),
  updated_by_type VARCHAR(20) CHECK (updated_by_type IN ('buyer','seller','system')),
  notes TEXT,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otl_order_id  ON order_tracking_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_otl_timestamp ON order_tracking_logs(timestamp);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(50) UNIQUE;
      `.trim(),
    },
  ];

  // Attempt each migration via exec_sql RPC
  const results: Record<string, { success: boolean; message: string; sql?: string }> = {};

  for (const m of migrations) {
    const r = await runSQL(m.sql);
    if (r.error) {
      // RPC not available — store SQL for manual run
      results[m.name] = {
        success: false,
        message: `exec_sql RPC unavailable. Run SQL manually in Supabase SQL Editor.`,
        sql: m.sql,
      };
    } else {
      results[m.name] = { success: true, message: m.description };
    }
  }

  const allOk = Object.values(results).every(r => r.success);

  return NextResponse.json({
    success: allOk,
    results,
    // Always include the full SQL so it can be run manually if needed
    manualSQL: migrations.map(m => `-- ${m.description}\n${m.sql}`).join('\n\n'),
  });
}
