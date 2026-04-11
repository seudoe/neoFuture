import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const farmerId = formData.get('farmerId') as string;
    const workId = formData.get('workId') as string; // optional — can be 'temp'

    if (!file || !farmerId) {
      return NextResponse.json({ error: 'file and farmerId are required' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${farmerId}/${workId || 'temp'}/${fileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error } = await supabase.storage
      .from('farmer_works')
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('farmer_works')
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: publicUrl, path: filePath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
