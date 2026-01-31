import { NextRequest, NextResponse } from 'next/server';
import { msnChartTimeRange } from '@/lib/providers/msn';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stockId = searchParams.get('stockId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!stockId) {
      return NextResponse.json(
        { error: 'Stock ID is required' },
        { status: 400 }
      );
    }

    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    const { data, available } = await msnChartTimeRange(stockId, startDate, endDate);

    return NextResponse.json({
      data,
      available,
      count: data.length,
    });
  } catch (error) {
    console.error('MSN KeyRatios API error:', error);
    return NextResponse.json(
      { error: 'MSN KeyRatios failed', data: [], available: false },
      { status: 500 }
    );
  }
}
