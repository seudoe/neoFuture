import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    const client = await pool.connect();
    
    // Add wastage columns to orders table
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS ordered_quantity INTEGER,
      ADD COLUMN IF NOT EXISTS delivered_quantity INTEGER,
      ADD COLUMN IF NOT EXISTS wasted_quantity INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS adjusted_amount DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
    `);
    
    // Update existing orders
    await client.query(`
      UPDATE orders 
      SET ordered_quantity = quantity,
          original_amount = total_price,
          adjusted_amount = total_price
      WHERE ordered_quantity IS NULL;
    `);
    
    // Create wastage reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_wastage_reports (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        reported_by INTEGER NOT NULL REFERENCES users(id),
        delivered_quantity INTEGER NOT NULL,
        wasted_quantity INTEGER NOT NULL DEFAULT 0,
        reason TEXT,
        photo_urls TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_order_report UNIQUE(order_id)
      );
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wastage_reports_order ON order_wastage_reports(order_id);
      CREATE INDEX IF NOT EXISTS idx_orders_verification ON orders(verification_status);
    `);
    
    client.release();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Wastage reporting system setup completed successfully' 
    });
  } catch (error: any) {
    console.error('Error setting up wastage system:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
