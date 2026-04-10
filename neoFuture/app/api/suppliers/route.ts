import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get all farmers (suppliers) with their product counts and stats
    const { data: suppliers, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone_number,
        created_at
      `)
      .eq('role', 'farmer')
      .order('name', { ascending: true });

    if (error) {
      console.error('Suppliers fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      );
    }

    // Get product counts and stats for each supplier
    const suppliersWithStats = await Promise.all(
      suppliers.map(async (supplier) => {
        // Get product count
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', supplier.id)
          .eq('status', 'active');

        // Get products for calculating stats
        const { data: products } = await supabase
          .from('products')
          .select('price_single, quantity, category')
          .eq('seller_id', supplier.id)
          .eq('status', 'active');

        // Calculate stats
        const totalStock = products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
        const avgPrice = (products && products.length > 0)
          ? Math.round(products.reduce((sum, p) => sum + p.price_single, 0) / products.length)
          : 0;
        
        // Get unique categories
        const categories = [...new Set(products?.map(p => p.category) || [])];

        return {
          ...supplier,
          productCount: productCount || 0,
          totalStock,
          avgPrice,
          categories,
          joinedDate: new Date(supplier.created_at).toLocaleDateString()
        };
      })
    );

    return NextResponse.json({
      suppliers: suppliersWithStats
    });

  } catch (error) {
    console.error('Suppliers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}