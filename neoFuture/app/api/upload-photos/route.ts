import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { productId, photoUrls } = await request.json();

    if (!productId || !photoUrls || !Array.isArray(photoUrls)) {
      return NextResponse.json(
        { error: 'Product ID and photo URLs are required' },
        { status: 400 }
      );
    }

    // Update product with photo URLs
    const { data, error } = await supabase
      .from('products')
      .update({ photos: photoUrls })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json(
        { error: 'Failed to update product photos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data
    });

  } catch (error) {
    console.error('Upload photos API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}