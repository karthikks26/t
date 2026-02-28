import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
    try {
        const resolvedParams = await params; // Next.js 16 Async Fix
        const symbol = `${resolvedParams.symbol}.NS`;
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
        
        const result = await yahooFinance.chart(symbol, { period1: fourDaysAgo, interval: '5m' });
        if (!result.quotes) return NextResponse.json({ success: false, prices: [] });

        const lastDate = result.quotes[result.quotes.length - 1].date.toISOString().split('T')[0];
        const prices = result.quotes
            .filter(q => q.date.toISOString().split('T')[0] === lastDate && q.close !== null)
            .map(q => q.close);

        return NextResponse.json({ success: true, prices });
    } catch (e) {
        return NextResponse.json({ success: false, prices: [] });
    }
}