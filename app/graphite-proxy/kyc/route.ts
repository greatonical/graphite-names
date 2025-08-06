// app/api/graphite-proxy/kyc/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GRAPHITE_API_BASE = 'https://api.test.atgraphite.com/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const tag = searchParams.get('tag') || 'latest';

  try {
    console.log(`📡 KYC Proxy - Fetching KYC data for ${address}`);

    // Validate address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Build the correct Graphite API URL with query parameters
    const apiUrl = new URL(GRAPHITE_API_BASE);
    apiUrl.searchParams.set('module', 'account');
    apiUrl.searchParams.set('action', 'kyc');
    apiUrl.searchParams.set('address', address);
    apiUrl.searchParams.set('tag', tag);
    
    // Add API key if available (store securely in environment variables)
    if (process.env.GRAPHITE_API_KEY) {
      apiUrl.searchParams.set('apikey', process.env.GRAPHITE_API_KEY);
    }

    console.log(`📡 KYC Proxy - Requesting: ${apiUrl.toString()}`);

    // Make request to Graphite API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'GraphiteNames/1.0',
      },
    });

    console.log(`📡 KYC Proxy - Graphite API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ KYC Proxy - Graphite API error:`, errorText);
      
      return NextResponse.json(
        { 
          error: 'Graphite KYC API request failed',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ KYC Proxy - Successfully fetched KYC data for ${address}:`, data);

    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    console.error('❌ KYC Proxy - Error:', error);
    
    return NextResponse.json(
      { 
        error: 'KYC Proxy server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}