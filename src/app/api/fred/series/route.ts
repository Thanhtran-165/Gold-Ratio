import { NextRequest, NextResponse } from 'next/server';
import { getFredSeries } from '@/lib/providers/fred';
import { getWindowStartDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const seriesId = searchParams.get('series');
    const window = (searchParams.get('window') || '1Y') as any;
    const apiKey = request.headers.get('x-fred-api-key');

    if (!seriesId) {
      return NextResponse.json(
        { error: 'Series ID is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'FRED API key is required' },
        { status: 401 }
      );
    }

    const startDate = getWindowStartDate(window);
    const endDate = new Date();

    const data = await getFredSeries(seriesId, apiKey, startDate, endDate);

    return NextResponse.json({
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('FRED series API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FRED series' },
      { status: 500 }
    );
  }
}
