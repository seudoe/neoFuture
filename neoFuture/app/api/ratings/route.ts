import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch ratings for an order or user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const userId = searchParams.get('userId');
        const userType = searchParams.get('userType'); // 'buyer' or 'seller'

        if (orderId) {
            // Fetch ratings for a specific order with manual joins
            const { data: ratings, error } = await supabase
                .from('ratings')
                .select('*')
                .eq('order_id', parseInt(orderId))
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Ratings fetch error:', error);
                // If table doesn't exist, return empty array instead of error
                if (error.code === 'PGRST116' || error.message?.includes('relation "ratings" does not exist')) {
                    return NextResponse.json({
                        ratings: [],
                        message: 'Ratings table does not exist yet. Please create it first.'
                    });
                }
                return NextResponse.json(
                    { error: 'Failed to fetch ratings', details: error.message },
                    { status: 500 }
                );
            }

            // Manually fetch user details for each rating
            const ratingsWithUsers = await Promise.all(
                (ratings || []).map(async (rating) => {
                    // Fetch rater details
                    const { data: rater } = await supabase
                        .from('users')
                        .select('id, name')
                        .eq('id', rating.rater_id)
                        .single();

                    // Fetch rated user details
                    const { data: rated } = await supabase
                        .from('users')
                        .select('id, name')
                        .eq('id', rating.rated_id)
                        .single();

                    // Fetch order and product details
                    const { data: order } = await supabase
                        .from('orders')
                        .select('id, product_id')
                        .eq('id', rating.order_id)
                        .single();

                    let product = null;
                    if (order?.product_id) {
                        const { data: productData } = await supabase
                            .from('products')
                            .select('id, name')
                            .eq('id', order.product_id)
                            .single();
                        product = productData;
                    }

                    return {
                        ...rating,
                        rater: rater || { id: rating.rater_id, name: 'Unknown User' },
                        rated: rated || { id: rating.rated_id, name: 'Unknown User' },
                        order: order ? {
                            id: order.id,
                            product: product || { id: order.product_id, name: 'Unknown Product' }
                        } : null
                    };
                })
            );

            return NextResponse.json({
                ratings: ratingsWithUsers
            });
        }

        if (userId && userType) {
            // Fetch ratings received by a user
            const { data: ratings, error } = await supabase
                .from('ratings')
                .select('*')
                .eq('rated_id', parseInt(userId))
                .eq('rater_type', userType === 'buyer' ? 'seller' : 'buyer')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('User ratings fetch error:', error);
                // If table doesn't exist, return empty array instead of error
                if (error.code === 'PGRST116' || error.message?.includes('relation "ratings" does not exist')) {
                    return NextResponse.json({
                        ratings: [],
                        message: 'Ratings table does not exist yet. Please create it first.'
                    });
                }
                return NextResponse.json(
                    { error: 'Failed to fetch user ratings', details: error.message },
                    { status: 500 }
                );
            }

            // Manually fetch user and order details for each rating
            const ratingsWithDetails = await Promise.all(
                (ratings || []).map(async (rating) => {
                    // Fetch rater details
                    const { data: rater } = await supabase
                        .from('users')
                        .select('id, name')
                        .eq('id', rating.rater_id)
                        .single();

                    // Fetch order and product details
                    const { data: order } = await supabase
                        .from('orders')
                        .select('id, product_id')
                        .eq('id', rating.order_id)
                        .single();

                    let product = null;
                    if (order?.product_id) {
                        const { data: productData } = await supabase
                            .from('products')
                            .select('id, name')
                            .eq('id', order.product_id)
                            .single();
                        product = productData;
                    }

                    return {
                        ...rating,
                        rater: rater || { id: rating.rater_id, name: 'Unknown User' },
                        order: order ? {
                            id: order.id,
                            product: product || { id: order.product_id, name: 'Unknown Product' }
                        } : null
                    };
                })
            );

            return NextResponse.json({
                ratings: ratingsWithDetails
            });
        }

        return NextResponse.json(
            { error: 'Order ID or User ID with user type is required' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Ratings GET API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new rating
export async function POST(request: NextRequest) {
    try {
        const {
            orderId,
            raterId,
            ratedId,
            raterType, // 'buyer' or 'seller'
            rating,
            review
        } = await request.json();

        if (!orderId || !raterId || !ratedId || !raterType || !rating) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate rating value
        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        // Check if rating already exists for this order and rater
        const { data: existingRating, error: checkError } = await supabase
            .from('ratings')
            .select('id')
            .eq('order_id', orderId)
            .eq('rater_id', raterId)
            .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

        if (checkError) {
            console.error('Rating check error:', checkError);
            // If table doesn't exist, return a more helpful error
            if (checkError.code === 'PGRST116' || checkError.message?.includes('relation "ratings" does not exist')) {
                return NextResponse.json(
                    { error: 'Ratings table does not exist. Please create it first by visiting /api/create-ratings-table' },
                    { status: 500 }
                );
            }
            return NextResponse.json(
                { error: 'Failed to check existing rating', details: checkError.message },
                { status: 500 }
            );
        }

        if (existingRating) {
            return NextResponse.json(
                { error: 'Rating already exists for this order' },
                { status: 400 }
            );
        }

        // Verify the order exists and the rater is part of it
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('buyer_id, seller_id, status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Verify the rater is part of this order
        const isValidRater = (raterType === 'buyer' && order.buyer_id === raterId) ||
            (raterType === 'seller' && order.seller_id === raterId);

        if (!isValidRater) {
            return NextResponse.json(
                { error: 'Unauthorized to rate this order' },
                { status: 403 }
            );
        }

        // Allow rating for orders of any status (removed delivery requirement)

        // Create rating
        const { data: newRating, error: ratingError } = await supabase
            .from('ratings')
            .insert({
                order_id: orderId,
                rater_id: raterId,
                rated_id: ratedId,
                rater_type: raterType,
                rating,
                review: review || null
            })
            .select()
            .single();

        if (ratingError) {
            console.error('Rating creation error:', ratingError);
            return NextResponse.json(
                { error: 'Failed to create rating' },
                { status: 500 }
            );
        }

        // Manually fetch user details for the response
        const { data: rater } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', raterId)
            .single();

        const { data: rated } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', ratedId)
            .single();

        const ratingWithUsers = {
            ...newRating,
            rater: rater || { id: raterId, name: 'Unknown User' },
            rated: rated || { id: ratedId, name: 'Unknown User' }
        };

        return NextResponse.json({
            success: true,
            rating: ratingWithUsers,
            message: 'Rating submitted successfully'
        });

    } catch (error) {
        console.error('Ratings POST API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update existing rating
export async function PUT(request: NextRequest) {
    try {
        const {
            ratingId,
            raterId,
            rating,
            review
        } = await request.json();

        if (!ratingId || !raterId || !rating) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate rating value
        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        // Update rating (only if the rater owns it)
        const { data: updatedRating, error: updateError } = await supabase
            .from('ratings')
            .update({
                rating,
                review: review || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', ratingId)
            .eq('rater_id', raterId)
            .select()
            .single();

        if (updateError) {
            console.error('Rating update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update rating' },
                { status: 500 }
            );
        }

        if (!updatedRating) {
            return NextResponse.json(
                { error: 'Rating not found or unauthorized' },
                { status: 404 }
            );
        }

        // Manually fetch user details for the response
        const { data: rater } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', raterId)
            .single();

        const { data: rated } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', updatedRating.rated_id)
            .single();

        const ratingWithUsers = {
            ...updatedRating,
            rater: rater || { id: raterId, name: 'Unknown User' },
            rated: rated || { id: updatedRating.rated_id, name: 'Unknown User' }
        };

        return NextResponse.json({
            success: true,
            rating: ratingWithUsers,
            message: 'Rating updated successfully'
        });

    } catch (error) {
        console.error('Ratings PUT API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}