import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('seller_id');
    const category = searchParams.get('category');

    let query = supabase
      .from('products')
      .select(`
        *,
        users!products_seller_id_fkey (
          name,
          phone_number
        )
      `)
      .order('created_at', { ascending: false });

    // Only filter by active status for public browse (no seller_id)
    if (!sellerId) {
      query = query.eq('status', 'active');
    }

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Products fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedProducts = products?.map(product => ({
      ...product,
      seller_name: product.users?.name,
      seller_phone: product.users?.phone_number,
      photos: product.photos || []
    })) || [];

    // Debug logging
    console.log('Products with photos:', transformedProducts.map(p => ({
      id: p.id,
      name: p.name,
      photos: p.photos
    })));

    return NextResponse.json({
      products: transformedProducts
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json();

    const { name, category, quantity, seller_id, price_single, price_multiple, location, description } = productData;

    if (!name || !category || !quantity || !seller_id || !price_single) {
      return NextResponse.json(
        { error: 'Name, category, quantity, seller_id, and price_single are required' },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        category,
        quantity,
        seller_id,
        price_single,
        price_multiple,
        location,
        description,
        status: 'active',
        photos: []
      })
      .select()
      .single();

    if (error) {
      console.error('Product creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Products POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}