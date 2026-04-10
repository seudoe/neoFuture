import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/phone and password are required' },
        { status: 400 }
      );
    }

    const isEmail = identifier.includes('@');
    const field = isEmail ? 'email' : 'phone_number';

    const client = await pool.connect();
    let result;
    try {
      result = await client.query(
        `SELECT * FROM users WHERE ${field} = $1 LIMIT 1`,
        [identifier]
      );
    } finally {
      client.release();
    }

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const storedPassword = user.password;
    const isBcrypt = storedPassword?.startsWith('$2');

    console.log('Login attempt:', {
      identifier,
      userFound: !!user,
      storedPasswordPrefix: storedPassword?.substring(0, 7),
      isBcrypt,
      inputPassword: password
    });

    // Support both bcrypt hashed and plain text passwords
    const isValidPassword = isBcrypt
      ? await bcrypt.compare(password, storedPassword)
      : password === storedPassword;

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}