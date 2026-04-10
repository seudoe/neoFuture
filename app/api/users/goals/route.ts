import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/users/goals?userId=x
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT goals FROM users WHERE id = $1', [parseInt(userId)]);
    client.release();
    return NextResponse.json({ goals: result.rows[0]?.goals || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/users/goals  { userId, goals: {...} }
export async function PATCH(request: NextRequest) {
  try {
    const { userId, goals } = await request.json();
    if (!userId || !goals) return NextResponse.json({ error: 'userId and goals required' }, { status: 400 });

    const client = await pool.connect();
    await client.query('UPDATE users SET goals = $1 WHERE id = $2', [JSON.stringify(goals), parseInt(userId)]);
    client.release();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
