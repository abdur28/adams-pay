// app/api/get-exchange-rate/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface ExchangeRateResponse {
  date: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from')?.toLowerCase();
    const to = searchParams.get('to')?.toLowerCase();

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Both "from" and "to" currency parameters are required' },
        { status: 400 }
      );
    }

    // If same currency, return rate of 1
    if (from === to) {
      return NextResponse.json({
        success: true,
        data: {
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          rate: 1,
          date: new Date().toISOString().split('T')[0],
          source: 'same-currency'
        }
      });
    }

    // Primary URL using jsdelivr CDN
    const primaryUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`;
    
    // Fallback URL using Cloudflare
    const fallbackUrl = `https://latest.currency-api.pages.dev/v1/currencies/${from}.json`;

    let response: Response;
    let data: ExchangeRateResponse;

    try {
      // Try primary URL first
      response = await fetch(primaryUrl, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`Primary API failed with status: ${response.status}`);
      }

      data = await response.json();
    } catch (primaryError) {
      console.warn('Primary API failed, trying fallback:', primaryError);

      try {
        // Try fallback URL
        response = await fetch(fallbackUrl, {
          next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
          throw new Error(`Fallback API failed with status: ${response.status}`);
        }

        data = await response.json();
      } catch (fallbackError) {
        console.error('Both APIs failed:', { primaryError, fallbackError });
        return NextResponse.json(
          { 
            error: 'Failed to fetch exchange rate from both primary and fallback APIs',
            details: 'Currency exchange service is temporarily unavailable'
          },
          { status: 503 }
        );
      }
    }

    // Extract the rate for the target currency
    const currencies = data[from];
    if (!currencies || typeof currencies !== 'object') {
      return NextResponse.json(
        { error: 'Invalid response format from currency API' },
        { status: 502 }
      );
    }

    const rate = currencies[to];
    if (rate === undefined || rate === null) {
      return NextResponse.json(
        { 
          error: `Exchange rate not available for ${from.toUpperCase()} to ${to.toUpperCase()}`,
          availableCurrencies: Object.keys(currencies).slice(0, 10) // Show first 10 available currencies
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: parseFloat(rate),
        date: data.date,
        source: 'fawazahmed0-currency-api'
      }
    });

  } catch (error) {
    console.error('Exchange rate API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
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