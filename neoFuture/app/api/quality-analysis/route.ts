import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Your ngrok API URL
    const API_URL = 'https://bountiful-immanuel-overvehemently.ngrok-free.dev/predict';
    
    // Forward the request to your API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any other headers your API needs
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the response
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Quality analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze quality' },
      { status: 500 }
    );
  }
}

// Handle GET requests if needed
export async function GET() {
  return NextResponse.json({ message: 'Quality Analysis API is running' });
}