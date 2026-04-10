import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'));

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT NOW() as current_time');
      console.log('Connection successful!', result.rows[0]);
      
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        currentTime: result.rows[0].current_time
      });
    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')
      },
      { status: 500 }
    );
  }
}