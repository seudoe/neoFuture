import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/farmer-works?farmer_id=x
export async function GET(request: NextRequest) {
  const farmerId = new URL(request.url).searchParams.get('farmer_id');
  if (!farmerId) return NextResponse.json({ error: 'farmer_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('farmer_works')
    .select('*')
    .eq('farmer_id', parseInt(farmerId))
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ works: data || [] });
}

// POST /api/farmer-works
export async function POST(request: NextRequest) {
  try {
    const { farmer_id, title, description, media_url, media_urls, work_from, work_to } = await request.json();
    if (!farmer_id || !title) return NextResponse.json({ error: 'farmer_id and title required' }, { status: 400 });

    const { data, error } = await supabase
      .from('farmer_works')
      .insert({
        farmer_id,
        title,
        description,
        media_url: media_url || null,
        media_urls: media_urls || [],
        work_from: work_from || null,
        work_to: work_to || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, work: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/farmer-works?id=x
export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('farmer_works').delete().eq('id', parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH /api/farmer-works — edit existing work
export async function PATCH(request: NextRequest) {
  try {
    const { id, title, description, media_urls, media_url, work_from, work_to } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data, error } = await supabase
      .from('farmer_works')
      .update({
        title,
        description,
        media_urls: media_urls ?? [],
        media_url: media_url ?? null,
        work_from: work_from ?? null,
        work_to: work_to ?? null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, work: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
