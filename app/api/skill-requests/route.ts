import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/skill-requests?learner_id=x  — sent requests
// GET /api/skill-requests?teacher_id=x  — received requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learner_id');
  const teacherId = searchParams.get('teacher_id');

  try {
    if (learnerId) {
      const { data, error } = await supabase
        .from('skill_learning_requests')
        .select(`
          *,
          skill:farmer_skills ( skill_name, category ),
          teacher:users!skill_learning_requests_teacher_id_fkey ( id, name, phone_number )
        `)
        .eq('learner_id', parseInt(learnerId))
        .order('created_at', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ requests: data || [] });
    }

    if (teacherId) {
      const { data, error } = await supabase
        .from('skill_learning_requests')
        .select(`
          *,
          skill:farmer_skills ( skill_name, category ),
          learner:users!skill_learning_requests_learner_id_fkey ( id, name, phone_number )
        `)
        .eq('teacher_id', parseInt(teacherId))
        .order('created_at', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ requests: data || [] });
    }

    return NextResponse.json({ error: 'learner_id or teacher_id required' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/skill-requests — apply to learn
export async function POST(request: NextRequest) {
  try {
    const { learner_id, teacher_id, skill_id, message } = await request.json();
    if (!learner_id || !teacher_id || !skill_id) {
      return NextResponse.json({ error: 'learner_id, teacher_id, skill_id required' }, { status: 400 });
    }
    if (learner_id === teacher_id) {
      return NextResponse.json({ error: 'You cannot apply to learn from yourself' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('skill_learning_requests')
      .insert({ learner_id, teacher_id, skill_id, message, status: 'pending' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'You have already applied for this skill' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, request: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/skill-requests — teacher accepts/rejects
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    if (!id || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'id and status (accepted|rejected) required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('skill_learning_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, request: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
