import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET all users
export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
    client.release();
    
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      [email, name]
    );
    client.release();
    
    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId, name, email, phone_number } = await request.json();
    
    console.log('PUT /api/users - Received:', { userId, name, email, phone_number });
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (phone_number !== undefined) {
      updates.push(`phone_number = $${paramCount}`);
      values.push(phone_number);
      paramCount++;
    }

    if (updates.length === 0) {
      client.release();
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    console.log('Executing query:', query);
    console.log('With values:', values);
    
    const result = await client.query(query, values);
    client.release();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('Update successful:', result.rows[0]);
    
    return NextResponse.json({ 
      success: true, 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
