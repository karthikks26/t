"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Clock, AlertCircle, ExternalLink, LayoutList, GalleryHorizontalEnd } from "lucide-react";
import { Sparklines, SparklinesLine } from 'react-sparklines';
import axios from 'axios';

export default function MarketScreener() {
  const [market, setMarket] = useState('NIFTY'); 
  const [trend, setTrend] = useState('gainers'); 
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryTimer, setRetryTimer] = useState(0);
  
  // NEW: Toggle between List and Swipe views
  const [viewMode, setViewMode] = useState<'list' | 'swipe'>('list');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`/api/market?type=${trend}`);
      if (res.data.success) {
        const rawData = market === 'NIFTY' ? res.data.data.NIFTY.data : res.data.data.FOSec.data;
        setStocks(rawData || []);
        setRetryTimer(0);
      } else { throw new Error(); }
    } catch (e) {
      setError(true);
      setRetryTimer(10); 
    }
    setLoading(false);
  }, [market, trend]);

  useEffect(() => {
    let timer: any;
    if (error && retryTimer > 0) {
      timer = setInterval(() => setRetryTimer(prev => prev - 1), 1000);
    } else if (error && retryTimer === 0) {
      fetchData();
    } else {
      timer = setInterval(fetchData, 60000); 
    }
    return () => clearInterval(timer);
  }, [error, retryTimer, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-10 font-sans overflow-x-hidden">
      {/* Hide scrollbar for the swipe view but keep functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header Controls */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-blue-500 uppercase">MARKET PULSE</h1>
          </div>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'swipe' : 'list')}
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center text-blue-400"
            >
              {viewMode === 'list' ? <GalleryHorizontalEnd className="h-5 w-5" /> : <LayoutList className="h-5 w-5" />}
            </button>
            {/* Refresh Button */}
            <button onClick={fetchData} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin text-blue-400' : 'text-white'}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <Tabs defaultValue="NIFTY" onValueChange={setMarket} className="w-full">
          <TabsList className="w-full h-14 bg-white/5 p-1 rounded-2xl grid grid-cols-2 border border-white/10">
            <TabsTrigger value="NIFTY" className="rounded-xl font-black text-xs tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 transition-all uppercase">NIFTY 50</TabsTrigger>
            <TabsTrigger value="FOSec" className="rounded-xl font-black text-xs tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 transition-all uppercase">F&O STOCKS</TabsTrigger>
          </TabsList>
        </Tabs>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-12 text-center space-y-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
            <h2 className="text-xl font-black uppercase text-white">Fetching Failed</h2>
            <div className="text-3xl font-black text-white"><Clock className="inline h-8 w-8 mr-2" /> {retryTimer}S</div>
          </div>
        ) : (
          <div className="bg-[#0f172a] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden pb-4">
            
            {/* Inner Toggle (Gainers/Losers) */}
            <div className="p-4 border-b border-white/5 flex bg-white/[0.02] justify-between items-center">
              <div className="flex bg-white/5 p-1 rounded-full gap-1">
                <button onClick={() => setTrend('gainers')} className={`px-5 py-2 rounded-full text-[10px] font-black transition-all ${trend === 'gainers' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>GAINERS</button>
                <button onClick={() => setTrend('loosers')} className={`px-5 py-2 rounded-full text-[10px] font-black transition-all ${trend === 'loosers' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}>LOSERS</button>
              </div>
            </div>

            {/* Dynamic View Rendering */}
            {loading ? (
               <div className="p-8 h-40 flex items-center justify-center text-slate-500 animate-pulse font-bold">Loading Data...</div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW */
              <div className="divide-y divide-white/5">
                {stocks.map(s => <StockListItem key={s.symbol} stock={s} isUp={trend === 'gainers'} />)}
              </div>
            ) : (
              /* SWIPE CAROUSEL VIEW */
              <div className="flex overflow-x-auto snap-x snap-mandatory hide-scroll w-full gap-4 p-6">
                {stocks.map(s => <StockSwipeCard key={s.symbol} stock={s} isUp={trend === 'gainers'} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. LIST ITEM COMPONENT
// ----------------------------------------------------------------------
function StockListItem({ stock, isUp }: { stock: any, isUp: boolean }) {
  const [prices, setPrices] = useState<number[]>([]);
  useEffect(() => {
    axios.get(`/api/sparkline/${stock.symbol}`).then(res => res.data.success && setPrices(res.data.prices));
  }, [stock.symbol]);

  return (
    <div className="flex items-center justify-between p-6 hover:bg-white/[0.03] transition-all group">
      <div className="w-1/3">
        <h3 className="text-lg md:text-xl font-black text-white uppercase">{stock.symbol}</h3>
      </div>
      <div className="w-1/4 h-8 px-2">
        {prices.length > 0 && (
          <Sparklines data={prices} margin={5}>
            <SparklinesLine color={isUp ? "#10b981" : "#f43f5e"} style={{ strokeWidth: 4, fill: "none" }} />
          </Sparklines>
        )}
      </div>
      <div className="w-1/3 text-right">
        <p className="text-lg font-black text-white italic tracking-tighter">₹{stock.ltp}</p>
        <div className={`text-xs font-black ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
           {isUp ? '▲' : '▼'} {stock.perChange}%
        </div>
      </div>
      {/* EXPLICIT BUTTON to open TradingView (Solves the click bug) */}
      <a 
        href={`https://in.tradingview.com/chart/?symbol=NSE:${stock.symbol}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="ml-4 p-2 bg-white/5 rounded-xl hover:bg-blue-600 hover:text-white transition-colors text-slate-500"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. SWIPE CARD COMPONENT (Mobile Focus)
// ----------------------------------------------------------------------
function StockSwipeCard({ stock, isUp }: { stock: any, isUp: boolean }) {
  const [prices, setPrices] = useState<number[]>([]);
  useEffect(() => {
    axios.get(`/api/sparkline/${stock.symbol}`).then(res => res.data.success && setPrices(res.data.prices));
  }, [stock.symbol]);

  return (
    <div className="snap-center min-w-[85%] md:min-w-[60%] flex-shrink-0 bg-white/5 rounded-[2rem] border border-white/10 p-6 flex flex-col justify-between">
      
      {/* Top: Info */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-black text-white">{stock.symbol}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">NSE INDIA</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white italic">₹{stock.ltp}</p>
          <div className={`text-sm font-black ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUp ? '▲' : '▼'} {stock.perChange}%
          </div>
        </div>
      </div>

      {/* Middle: Large Chart */}
      <div className="h-32 w-full bg-[#020617]/50 rounded-2xl p-4 border border-white/5 mb-6 shadow-inner">
        {prices.length > 0 ? (
          <Sparklines data={prices} margin={5}>
            <SparklinesLine color={isUp ? "#10b981" : "#f43f5e"} style={{ strokeWidth: 3, fill: "none" }} />
          </Sparklines>
        ) : (
           <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-600">Loading Chart...</div>
        )}
      </div>

      {/* Bottom: Action */}
      <a 
        href={`https://in.tradingview.com/chart/?symbol=NSE:${stock.symbol}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/50"
      >
        OPEN IN TRADINGVIEW <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}