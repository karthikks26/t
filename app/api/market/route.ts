import { NextResponse } from 'next/server';
import axios from 'axios';

let cookieCache = "";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'gainers';

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.nseindia.com/market-data/top-gainers-losers',
        'X-Requested-With': 'XMLHttpRequest',
        'Connection': 'keep-alive'
    };

    try {
        // 1. Visit homepage if cookies are missing or expired
        if (!cookieCache) {
            const home = await axios.get('https://www.nseindia.com', { headers });
            cookieCache = home.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || "";
        }

        // 2. Fetch data with the active session
        const nseRes = await axios.get(
            `https://www.nseindia.com/api/live-analysis-variations?index=${type}`,
            { headers: { ...headers, 'Cookie': cookieCache }, timeout: 8000 }
        );

        return NextResponse.json({ success: true, data: nseRes.data });
    } catch (error: any) {
        cookieCache = ""; // Clear for next retry
        return NextResponse.json({ success: false, status: error.response?.status }, { status: 500 });
    }
}