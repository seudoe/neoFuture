import { NextResponse } from 'next/server';
import { createTablesDirectSQL, seedDatabaseDirectSQL } from '@/lib/supabase-direct';

export async function POST() {
  try {
    console.log('🚀 Starting Supabase database setup with direct SQL...');
    
    // Create tables using direct SQL connection
    await createTablesDirectSQL();
    
    // Then seed the database
    await seedDatabaseDirectSQL();
    
    return NextResponse.json({ 
      success: true,
      message: 'Supabase database setup completed successfully!',
      note: 'Check server logs for user credentials'
    });
  } catch (error) {
    console.error('Supabase database setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Database setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}