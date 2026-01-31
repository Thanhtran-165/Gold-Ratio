import { NextRequest, NextResponse } from 'next/server';
import { pingFred } from '@/lib/providers/fred';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-fred-api-key');

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key is required',
      });
    }

    const isValid = await pingFred(apiKey);

    return NextResponse.json({
      success: isValid,
      message: isValid ? 'Connected to FRED API' : 'Invalid API key',
    });
  } catch (error) {
    console.error('FRED ping error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to FRED' },
      { status: 500 }
    );
  }
}
