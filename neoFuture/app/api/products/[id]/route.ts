import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Extract ID from URL path
function getIdFromUrl(url: string): string | null {
  const urlParts = url.split('/');
  const id = urlParts[urlParts.length - 1];
  return id || null;
}

// Add a simple GET method for testing
export async function GET(request: NextRequest) {
  const id = getIdFromUrl(request.url);
  console.log('GET - Full request URL:', request.url);
  console.log('GET - Extracted ID:', id);
  console.log('GET - typeof ID:', typeof id);
  
  return NextResponse.json({
    receivedId: id,
    parsedId: id ? parseInt(id) : null,
    isNaN: id ? isNaN(parseInt(id)) : true,
    url: request.url
  });
}

export async function PUT(request: NextRequest) {
  try {
    const id = getIdFromUrl(request.url);
    console.log('PUT - Full request URL:', request.url);
    console.log('PUT - Extracted ID:', id);
    console.log('PUT - typeof ID:', typeof id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'No product ID found in URL', url: request.url },
        { status: 400 }
      );
    }
    
    const productId = parseInt(id);
    console.log('PUT - Parsed product ID:', productId);
    console.log('PUT - Is NaN?', isNaN(productId));
    
    if (isNaN(productId)) {
      console.error('PUT - Invalid product ID - not a number:', id);
      return NextResponse.json(
        { 
          error: 'Invalid product ID', 
          receivedId: id,
          receivedType: typeof id,
          parsedId: productId,
          url: request.url
        },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    console.log('Updating product ID:', productId);
    console.log('Update data received:', updateData);

    // Remove any undefined or null values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
    );

    console.log('Clean update data:', cleanUpdateData);

    const { data: product, error } = await supabase
      .from('products')
      .update(cleanUpdateData)
      .eq('id', productId)
      .select('*')
      .single();

    if (error) {
      console.error('Product update error:', error);
      return NextResponse.json(
        { error: 'Failed to update product', details: error.message },
        { status: 500 }
      );
    }

    console.log('Product updated successfully:', product);

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        photos: product.photos || []
      }
    });

  } catch (error) {
    console.error('Product update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = getIdFromUrl(request.url);
    console.log('DELETE - Full request URL:', request.url);
    console.log('DELETE - Extracted ID:', id);
    console.log('DELETE - typeof ID:', typeof id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'No product ID found in URL', url: request.url },
        { status: 400 }
      );
    }
    
    const productId = parseInt(id);
    console.log('DELETE - Parsed product ID:', productId);
    console.log('DELETE - Is NaN?', isNaN(productId));
    
    if (isNaN(productId)) {
      console.error('DELETE - Invalid product ID - not a number:', id);
      return NextResponse.json(
        { 
          error: 'Invalid product ID', 
          receivedId: id,
          receivedType: typeof id,
          parsedId: productId,
          url: request.url
        },
        { status: 400 }
      );
    }

    console.log('Deleting product ID:', productId);

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Product deletion error:', error);
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      );
    }

    console.log('Product deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product deletion API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}