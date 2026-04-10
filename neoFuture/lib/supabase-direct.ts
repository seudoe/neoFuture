import { Pool } from 'pg';

// Create a direct PostgreSQL connection to Supabase
const supabasePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function createTablesDirectSQL() {
  const client = await supabasePool.connect();
  
  try {
    console.log('🚀 Creating tables using direct SQL connection...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'buyer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        price_single DECIMAL(10,2) NOT NULL,
        price_multiple DECIMAL(10,2),
        location VARCHAR(255),
        description TEXT,
        photos TEXT[],
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Products table created');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
      CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    `);
    console.log('✅ Indexes created');

    return { success: true };

  } catch (error) {
    console.error('Direct SQL table creation error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function seedDatabaseDirectSQL() {
  const client = await supabasePool.connect();
  
  try {
    console.log('🌱 Seeding database using direct SQL connection...');

    // Check if data already exists
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('⏭️  Database already seeded');
      return { success: true, message: 'Already seeded' };
    }

    // Import bcrypt here to avoid issues
    const bcrypt = require('bcryptjs');

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
    const insertedUsers = [];
    for (const user of users) {
      const result = await client.query(
        'INSERT INTO users (name, email, phone_number, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, role',
        [user.name, user.email, user.phone_number, user.password, user.role]
      );
      insertedUsers.push(result.rows[0]);
      console.log(`✅ Created user: ${user.name} (${user.role})`);
    }

    // Get farmer IDs
    const farmers = insertedUsers.filter(user => user.role === 'farmer');
    const farmer1Id = farmers[0].id;
    const farmer2Id = farmers[1].id;

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
    for (const product of products) {
      await client.query(
        'INSERT INTO products (name, category, quantity, seller_id, price_single, price_multiple, location, description, photos) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [product.name, product.category, product.quantity, product.seller_id, product.price_single, product.price_multiple, product.location, product.description, product.photos]
      );
      console.log(`✅ Created product: ${product.name} by ${product.seller_id === farmer1Id ? 'Rajesh Kumar' : 'Priya Singh'}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    
    // Log user credentials for reference
    console.log('\n📋 User Credentials:');
    console.log('===================');
    console.log('FARMERS:');
    console.log('1. Rajesh Kumar - Email: rajesh.farmer@agribridge.com, Phone: +91-9876543210, Password: farmer123');
    console.log('2. Priya Singh - Email: priya.farmer@agribridge.com, Phone: +91-9876543211, Password: farmer456');
    console.log('\nBUYERS:');
    console.log('1. Amit Sharma - Email: amit.buyer@agribridge.com, Phone: +91-9876543212, Password: buyer123');
    console.log('2. Sunita Patel - Email: sunita.buyer@agribridge.com, Phone: +91-9876543213, Password: buyer456');
    console.log('3. Ravi Gupta - Email: ravi.buyer@agribridge.com, Phone: +91-9876543214, Password: buyer789');

    return { success: true };

  } catch (error) {
    console.error('Direct SQL seeding error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default supabasePool;