import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/farmer-skills?farmer_id=x  — get skills for a farmer
// GET /api/farmer-skills?feed=true     — get all farmers with skills + works
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get('farmer_id');
  const feed = searchParams.get('feed');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
    if (feed === 'true') {
      // Fetch all farmers who have at least one skill
      const { data: farmers, error } = await supabase
        .from('users')
        .select(`
          id, name, phone_number, role,
          farmer_skills ( id, skill_name, description, category, is_teaching, experience_years ),
          farmer_works ( id, title, description, media_url, created_at )
        `)
        .eq('role', 'farmer')
        .order('id', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Only return farmers who have skills
      const withSkills = (farmers || []).filter((f: any) =>
        f.farmer_skills && f.farmer_skills.length > 0
      );

      return NextResponse.json({ farmers: withSkills, page, limit });
    }

    if (farmerId) {
      const { data, error } = await supabase
        .from('farmer_skills')
        .select('*')
        .eq('farmer_id', parseInt(farmerId))
        .order('created_at', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ skills: data || [] });
    }

    return NextResponse.json({ error: 'farmer_id or feed=true required' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/farmer-skills — add a skill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farmer_id, skill_name, description, category, is_teaching, experience_years } = body;

    if (!farmer_id || !skill_name || !category) {
      return NextResponse.json({ error: 'farmer_id, skill_name, category required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('farmer_skills')
      .insert({ farmer_id, skill_name, description, category, is_teaching: !!is_teaching, experience_years: experience_years || 0 })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, skill: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/farmer-skills — toggle is_teaching
export async function PATCH(request: NextRequest) {
  try {
    const { id, is_teaching } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data, error } = await supabase
      .from('farmer_skills')
      .update({ is_teaching: !!is_teaching })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, skill: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/farmer-skills?id=x
export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('farmer_skills').delete().eq('id', parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
