import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    console.log('🌱 Starting Supabase seeding with client library...');

    // Check if users already exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking users:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing users',
        details: checkError.message,
        note: 'Make sure the users table exists in Supabase'
      }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('⏭️  Database already seeded');
      return NextResponse.json({
        success: true,
        message: 'Database already seeded',
        existingUsers: existingUsers.length
      });
    }

    // Sample users with hashed passwords
    const users = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.farmer@agribridge.com',
        phone_number: '+91-9876543210',
        password: await bcrypt.hash('farmer123', 10),
        role: 'farmer'
      },
      {
        name: 'Priya Singh',
        email: 'priya.farmer@agribridge.com',
        phone_number: '+91-9876543211',
        password: await bcrypt.hash('farmer456', 10),
        role: 'farmer'
      },
      {
        name: 'Amit Sharma',
        email: 'amit.buyer@agribridge.com',
        phone_number: '+91-9876543212',
        password: await bcrypt.hash('buyer123', 10),
        role: 'buyer'
      },
      {
        name: 'Sunita Patel',
        email: 'sunita.buyer@agribridge.com',
        phone_number: '+91-9876543213',
        password: await bcrypt.hash('buyer456', 10),
        role: 'buyer'
      },
      {
        name: 'Ravi Gupta',
        email: 'ravi.buyer@agribridge.com',
        phone_number: '+91-9876543214',
        password: await bcrypt.hash('buyer789', 10),
        role: 'buyer'
      }
    ];

    // Insert users
    const { data: insertedUsers, error: usersError } = await supabase
      .from('users')
      .insert(users)
      .select('id, name, role');

    if (usersError) {
      console.error('Error inserting users:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert users',
        details: usersError.message
      }, { status: 500 });
    }

    console.log('✅ Created users:', insertedUsers?.map(u => `${u.name} (${u.role})`).join(', '));

    // Get farmer IDs
    const farmers = insertedUsers?.filter(user => user.role === 'farmer') || [];
    const farmer1Id = farmers[0]?.id;
    const farmer2Id = farmers[1]?.id;

    if (!farmer1Id || !farmer2Id) {
      throw new Error('Failed to get farmer IDs');
    }

    // Sample products
    const products = [
      // Farmer 1 (Rajesh Kumar) products
      {
        name: 'Fresh Tomatoes',
        category: 'vegetables',
        quantity: 250,
        seller_id: farmer1Id,
        price_single: 50.00,
        price_multiple: 45.00,
        location: 'Punjab, India',
        description: 'Fresh, organic tomatoes grown without pesticides. Perfect for cooking and salads.',
        photos: ['tomato1.jpg', 'tomato2.jpg']
      },
      {
        name: 'Organic Carrots',
        category: 'vegetables',
        quantity: 180,
        seller_id: farmer1Id,
        price_single: 40.00,
        price_multiple: 35.00,
        location: 'Punjab, India',
        description: 'Sweet and crunchy organic carrots, rich in vitamins and minerals.',
        photos: ['carrot1.jpg']
      },
      {
        name: 'Green Beans',
        category: 'vegetables',
        quantity: 120,
        seller_id: farmer1Id,
        price_single: 60.00,
        price_multiple: 55.00,
        location: 'Punjab, India',
        description: 'Fresh green beans, perfect for stir-fries and curries.',
        photos: ['beans1.jpg', 'beans2.jpg']
      },
      {
        name: 'Fresh Spinach',
        category: 'vegetables',
        quantity: 80,
        seller_id: farmer1Id,
        price_single: 30.00,
        price_multiple: 25.00,
        location: 'Punjab, India',
        description: 'Nutrient-rich spinach leaves, freshly harvested.',
        photos: ['spinach1.jpg']
      },
      {
        name: 'Red Onions',
        category: 'vegetables',
        quantity: 300,
        seller_id: farmer1Id,
        price_single: 35.00,
        price_multiple: 30.00,
        location: 'Punjab, India',
        description: 'High-quality red onions with strong flavor and long shelf life.',
        photos: ['onion1.jpg']
      },

      // Farmer 2 (Priya Singh) products
      {
        name: 'Basmati Rice',
        category: 'grains',
        quantity: 500,
        seller_id: farmer2Id,
        price_single: 80.00,
        price_multiple: 75.00,
        location: 'Haryana, India',
        description: 'Premium quality Basmati rice with long grains and aromatic fragrance.',
        photos: ['rice1.jpg', 'rice2.jpg']
      },
      {
        name: 'Fresh Mangoes',
        category: 'fruits',
        quantity: 200,
        seller_id: farmer2Id,
        price_single: 120.00,
        price_multiple: 110.00,
        location: 'Haryana, India',
        description: 'Sweet and juicy Alphonso mangoes, perfect for eating fresh or making desserts.',
        photos: ['mango1.jpg', 'mango2.jpg']
      },
      {
        name: 'Wheat Flour',
        category: 'grains',
        quantity: 400,
        seller_id: farmer2Id,
        price_single: 45.00,
        price_multiple: 40.00,
        location: 'Haryana, India',
        description: 'Fresh ground wheat flour, perfect for making rotis and bread.',
        photos: ['flour1.jpg']
      },
      {
        name: 'Fresh Cauliflower',
        category: 'vegetables',
        quantity: 150,
        seller_id: farmer2Id,
        price_single: 55.00,
        price_multiple: 50.00,
        location: 'Haryana, India',
        description: 'Fresh white cauliflower heads, great for curries and roasting.',
        photos: ['cauliflower1.jpg']
      },
      {
        name: 'Green Peas',
        category: 'vegetables',
        quantity: 100,
        seller_id: farmer2Id,
        price_single: 70.00,
        price_multiple: 65.00,
        location: 'Haryana, India',
        description: 'Sweet and tender green peas, freshly shelled.',
        photos: ['peas1.jpg', 'peas2.jpg']
      }
    ];

    // Insert products
    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select('name, seller_id');

    if (productsError) {
      console.error('Error inserting products:', productsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert products',
        details: productsError.message
      }, { status: 500 });
    }

    console.log('✅ Created products:', insertedProducts?.map(p => p.name).join(', '));

    console.log('🎉 Supabase database seeding completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Supabase database seeded successfully!',
      users: insertedUsers?.length || 0,
      products: insertedProducts?.length || 0,
      credentials: {
        farmers: [
          'Rajesh Kumar - Email: rajesh.farmer@agribridge.com, Phone: +91-9876543210, Password: farmer123',
          'Priya Singh - Email: priya.farmer@agribridge.com, Phone: +91-9876543211, Password: farmer456'
        ],
        buyers: [
          'Amit Sharma - Email: amit.buyer@agribridge.com, Phone: +91-9876543212, Password: buyer123',
          'Sunita Patel - Email: sunita.buyer@agribridge.com, Phone: +91-9876543213, Password: buyer456',
          'Ravi Gupta - Email: ravi.buyer@agribridge.com, Phone: +91-9876543214, Password: buyer789'
        ]
      }
    });

  } catch (error) {
    console.error('Supabase seeding error:', error);
    return NextResponse.json(
      { success: false, error: 'Seeding failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}