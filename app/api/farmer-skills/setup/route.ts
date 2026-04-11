import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS farmer_skills (
          id SERIAL PRIMARY KEY,
          farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          skill_name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100) NOT NULL,
          is_teaching BOOLEAN NOT NULL DEFAULT false,
          experience_years INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS farmer_works (
          id SERIAL PRIMARY KEY,
          farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          media_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS skill_learning_requests (
          id SERIAL PRIMARY KEY,
          learner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          skill_id INTEGER NOT NULL REFERENCES farmer_skills(id) ON DELETE CASCADE,
          message TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(learner_id, skill_id)
        );

        CREATE INDEX IF NOT EXISTS idx_farmer_skills_farmer ON farmer_skills(farmer_id);
        CREATE INDEX IF NOT EXISTS idx_farmer_skills_teaching ON farmer_skills(is_teaching);
        CREATE INDEX IF NOT EXISTS idx_farmer_works_farmer ON farmer_works(farmer_id);
        CREATE INDEX IF NOT EXISTS idx_slr_learner ON skill_learning_requests(learner_id);
        CREATE INDEX IF NOT EXISTS idx_slr_teacher ON skill_learning_requests(teacher_id);
      `
    });

    if (error) {
      // Tables may already exist — try direct creation as fallback
      const results = await Promise.allSettled([
        supabase.from('farmer_skills').select('id').limit(1),
        supabase.from('farmer_works').select('id').limit(1),
        supabase.from('skill_learning_requests').select('id').limit(1),
      ]);
      const allExist = results.every(r => r.status === 'fulfilled');
      if (allExist) return NextResponse.json({ success: true, note: 'Tables already exist' });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Skill marketplace tables created' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
