import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl, ML_API_CONFIG } from '../../../lib/config/ml-api';

export async function GET() {
  try {
    const apiUrl = getApiUrl();
    
    // Check if ML API is configured
    if (!apiUrl || apiUrl.includes('YOUR-NGROK-URL')) {
      return NextResponse.json({
        status: 'error',
        message: 'ML API not configured properly',
        configured: false,
        url: apiUrl
      }, { status: 500 });
    }

    // Test connectivity with a simple HEAD request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(apiUrl.replace('/predict', '/health') || apiUrl, {
        method: 'HEAD',
        headers: ML_API_CONFIG.HEADERS,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return NextResponse.json({
        status: 'success',
        message: 'ML API is reachable',
        configured: true,
        url: apiUrl,
        responseStatus: response.status,
        responseOk: response.ok
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return NextResponse.json({
            status: 'error',
            message: 'ML API request timed out',
            configured: true,
            url: apiUrl,
            error: 'timeout'
          }, { status: 408 });
        } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          return NextResponse.json({
            status: 'error',
            message: 'Unable to connect to ML API - network error',
            configured: true,
            url: apiUrl,
            error: 'network'
          }, { status: 503 });
        }
      }

      return NextResponse.json({
        status: 'error',
        message: 'ML API connectivity test failed',
        configured: true,
        url: apiUrl,
        error: fetchError instanceof Error ? fetchError.message : 'unknown'
      }, { status: 503 });
    }

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error during ML API test',
      error: error instanceof Error ? error.message : 'unknown'
    }, { status: 500 });
  }
}