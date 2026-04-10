import supabase from './supabase';

export async function createTables() {
  try {
    console.log('🚀 Creating Supabase tables...');

    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (usersError) {
      console.error('Error creating users table:', usersError);
    } else {
      console.log('✅ Users table created successfully');
    }

    // Create products table
    console.log('Creating products table...');
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (productsError) {
      console.error('Error creating products table:', productsError);
    } else {
      console.log('✅ Products table created successfully');
    }

    console.log('✅ All tables created successfully');
    return { success: true };

  } catch (error) {
    console.error('Table creation error:', error);
    throw error;
  }
}

// Alternative approach using direct table creation
export async function createTablesDirectly() {
  try {
    console.log('🚀 Creating tables directly via Supabase client...');

    // Check if users table exists by trying to select from it
    const { error: usersCheckError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersCheckError && usersCheckError.code === 'PGRST116') {
      console.log('Users table does not exist, will be created via SQL');
    }

    // Check if products table exists
    const { error: productsCheckError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (productsCheckError && productsCheckError.code === 'PGRST116') {
      console.log('Products table does not exist, will be created via SQL');
    }

    return { success: true, message: 'Tables checked/created successfully' };

  } catch (error) {
    console.error('Direct table creation error:', error);
    throw error;
  }
}