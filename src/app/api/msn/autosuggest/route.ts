import { NextRequest, NextResponse } from 'next/server';
import { msnAutosuggest } from '@/lib/providers/msn';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const stockId = await msnAutosuggest(query);

    return NextResponse.json({
      stockId,
      available: stockId !== null,
    });
  } catch (error) {
    console.error('MSN autosuggest API error:', error);
    return NextResponse.json(
      { error: 'MSN autosuggest failed', stockId: null, available: false },
      { status: 500 }
    );
  }
}
