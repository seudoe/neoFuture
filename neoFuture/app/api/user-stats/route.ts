import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch user statistics including average rating
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const userType = searchParams.get('userType'); // 'buyer' or 'seller'

        if (!userId || !userType) {
            return NextResponse.json(
                { error: 'User ID and user type are required' },
                { status: 400 }
            );
        }

        // Fetch user basic info
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, email, phone_number, role, created_at')
            .eq('id', parseInt(userId))
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch ratings received by this user
        const { data: receivedRatings, error: ratingsError } = await supabase
            .from('ratings')
            .select('rating, review, created_at, rater_id')
            .eq('rated_id', parseInt(userId));

        if (ratingsError) {
            console.error('Error fetching ratings:', ratingsError);
            // If ratings table doesn't exist, return basic stats
            if (ratingsError.code === 'PGRST116' || ratingsError.message?.includes('relation "ratings" does not exist')) {
                return NextResponse.json({
                    user,
                    stats: {
                        averageRating: 0,
                        totalRatings: 0,
                        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                        totalOrders: 0,
                        joinedDate: user.created_at
                    }
                });
            }
            return NextResponse.json(
                { error: 'Failed to fetch ratings' },
                { status: 500 }
            );
        }

        // Calculate average rating and distribution
        const ratings = receivedRatings || [];
        const totalRatings = ratings.length;
        const averageRating = totalRatings > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
            : 0;

        // Calculate rating distribution
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(r => {
            ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
        });

        // Fetch order statistics
        const orderColumn = userType === 'buyer' ? 'buyer_id' : 'seller_id';
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, status, created_at, total_price')
            .eq(orderColumn, parseInt(userId));

        const totalOrders = orders?.length || 0;
        const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
        const totalValue = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

        // Calculate additional stats based on user type
        let additionalStats = {};

        if (userType === 'seller') {
            // For farmers/sellers - get product stats
            const { data: products } = await supabase
                .from('products')
                .select('id, status, created_at')
                .eq('seller_id', parseInt(userId));

            additionalStats = {
                totalProducts: products?.length || 0,
                activeProducts: products?.filter(p => p.status === 'active').length || 0
            };
        }

        return NextResponse.json({
            user,
            stats: {
                averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                totalRatings,
                ratingDistribution,
                totalOrders,
                completedOrders,
                totalValue,
                joinedDate: user.created_at,
                ...additionalStats
            }
        });

    } catch (error) {
        console.error('User stats API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}