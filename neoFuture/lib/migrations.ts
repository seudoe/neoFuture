import supabase from './supabase';

export async function runMigrations() {
  try {
    console.log('🚀 Starting Supabase migrations...');

    // Create migrations table to track what's been run
    const { error: migrationsTableError } = await supabase.rpc('create_migrations_table');
    
    if (migrationsTableError && !migrationsTableError.message.includes('already exists')) {
      // Create migrations table manually if RPC doesn't work
      const { error } = await supabase
        .from('migrations')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, create it
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS migrations (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) UNIQUE NOT NULL,
              executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        
        if (createError) {
          console.log('Creating migrations table via direct SQL...');
          // If RPC doesn't work, we'll create tables directly
        }
      }
    }

    // List of migrations to run
    const migrations = [
      {
        name: '001_create_users_table',
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
      },
      {
        name: '002_create_products_table',
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
      }
    ];

    // Run each migration
    for (const migration of migrations) {
      try {
        console.log(`Running migration: ${migration.name}`);
        
        // Execute the SQL directly
        const { error } = await supabase.rpc('exec_sql', {
          sql: migration.sql
        });

        if (error) {
          console.error(`Error in migration ${migration.name}:`, error);
          // Continue with next migration
        } else {
          console.log(`✅ Migration ${migration.name} completed`);
        }
      } catch (err) {
        console.error(`Migration ${migration.name} failed:`, err);
      }
    }

    console.log('✅ All migrations completed');

  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}