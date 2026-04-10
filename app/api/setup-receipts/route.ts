import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();
    
    // Add receipt columns to orders table
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS receipt_url TEXT,
      ADD COLUMN IF NOT EXISTS receipt_generated BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS receipt_generated_at TIMESTAMP;
    `);
    
    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_receipt_generated ON orders(receipt_generated);
    `);
    
    client.release();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Receipt system setup completed successfully' 
    });
  } catch (error) {
    console.error('Error setting up receipt system:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup receipt system' },
      { status: 500 }
    );
  }
}
