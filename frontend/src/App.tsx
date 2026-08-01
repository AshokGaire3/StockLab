import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Bitcoin,
  RefreshCw,
} from 'lucide-react';
import { StockCard } from './components/StockCard';
import { CryptoCard } from './components/CryptoCard';
import { MarketOverview } from './components/MarketOverview';
import { SearchBar } from './components/SearchBar';
import { FilterControls } from './components/FilterControls';
import { PredictionPanel } from './components/PredictionPanel';
import { StockDetailModal } from './components/StockDetailModal';
import { financialApi } from './services/financialApi';
import { StockData, CryptoData } from './types/financial';

function App() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [crypto, setCrypto] = useState<CryptoData[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('AAPL');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'markets' | 'predict'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [apiError, setApiError] = useState<string>('');

  // Market filter in Markets tab: 'all' | 'stocks' | 'crypto' | 'gainers' | 'losers'
  const [assetFilter, setAssetFilter] = useState<'all' | 'stocks' | 'crypto' | 'gainers' | 'losers'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [modalStock, setModalStock] = useState<StockData | null>(null);

  // Sort states
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('change');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [stockData, cryptoData] = await Promise.all([
        financialApi.getStocks(),
        financialApi.getCrypto(),
      ]);
      setStocks(stockData);
      setCrypto(cryptoData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectStockAndOpenModal = (symbol: string) => {
    setSelectedStock(symbol);
    const found = stocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (found) {
      setModalStock(found);
    } else {
      setModalStock({
        symbol,
        name: symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        high: 0,
        low: 0,
        volume: 0,
        source: 'synthetic',
      });
    }
  };

  const liveCount = stocks.filter((stock) => stock.source === 'live').length;

  // Filtered Assets logic for Markets tab
  const getFilteredAssets = () => {
    let list: Array<StockData & { isCrypto?: boolean }> = stocks.map((s) => ({ ...s, isCrypto: false }));

    if (assetFilter === 'stocks') {
      list = stocks.map((s) => ({ ...s, isCrypto: false }));
    } else if (assetFilter === 'crypto') {
      list = crypto.map((c) => ({
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        price: c.current_price,
        change: c.price_change_24h,
        changePercent: c.price_change_percentage_24h,
        high: c.high_24h,
        low: c.low_24h,
        volume: c.total_volume,
        source: 'live',
        isCrypto: true,
      }));
    } else if (assetFilter === 'gainers') {
      list = stocks.filter((s) => s.changePercent > 0).map((s) => ({ ...s, isCrypto: false }));
    } else if (assetFilter === 'losers') {
      list = stocks.filter((s) => s.changePercent < 0).map((s) => ({ ...s, isCrypto: false }));
    }

    return [...list].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'symbol') {
        return sortOrder === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  };

  const filteredAssets = getFilteredAssets();

  const tabs = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'markets', label: 'Markets & Assets' },
    { id: 'predict', label: 'Forecast Engine' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#090D14] text-slate-100 font-sans flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <header className="bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Brand Logo & Tabs */}
              <div className="flex items-center gap-6">
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => setActiveTab('dashboard')}
                >
                  <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-xs">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-tight leading-none">StockLab</span>
                    <span className="text-[9px] font-mono text-slate-400 tracking-wider uppercase mt-0.5">Terminal</span>
                  </div>
                </div>

                <nav className="hidden md:flex items-center space-x-1">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors ${
                          isActive
                            ? 'bg-slate-800 text-white border border-slate-700'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Header Search Bar */}
              <div className="w-64 sm:w-80">
                <SearchBar onSelectStock={handleSelectStockAndOpenModal} />
              </div>

              {/* Header Status & Refresh */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 font-mono tabular-nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{liveCount} Live Feeds</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors disabled:opacity-50"
                  title="Refresh Market Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="md:hidden flex border-t border-slate-800 bg-slate-900/90 px-4 py-1.5 overflow-x-auto space-x-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold whitespace-nowrap ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <MarketOverview stocks={stocks} onSelectStock={handleSelectStockAndOpenModal} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Equities Panel */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Active Equities Matrix
                    </h2>
                    <button
                      onClick={() => {
                        setAssetFilter('stocks');
                        setActiveTab('markets');
                      }}
                      className="text-xs text-blue-400 hover:underline font-mono"
                    >
                      View All ({stocks.length}) →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {stocks.slice(0, 4).map((stock) => (
                      <StockCard
                        key={stock.symbol}
                        stock={stock}
                        onClick={handleSelectStockAndOpenModal}
                      />
                    ))}
                  </div>
                </div>

                {/* Cryptocurrency Panel */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Bitcoin className="w-3.5 h-3.5 text-amber-400" /> Digital Assets Matrix
                    </h2>
                    <button
                      onClick={() => {
                        setAssetFilter('crypto');
                        setActiveTab('markets');
                      }}
                      className="text-xs text-blue-400 hover:underline font-mono"
                    >
                      View All ({crypto.length}) →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {crypto.slice(0, 4).map((cryptoItem) => (
                      <CryptoCard
                        key={cryptoItem.id}
                        crypto={cryptoItem}
                        onClick={(sym) => handleSelectStockAndOpenModal(sym.toUpperCase())}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MARKETS TAB */}
          {activeTab === 'markets' && (
            <div className="space-y-4">
              {/* Filter Controls Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                {/* Asset Category Filters */}
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'all', label: 'All Assets' },
                    { id: 'stocks', label: 'Equities' },
                    { id: 'crypto', label: 'Crypto' },
                    { id: 'gainers', label: 'Gainers' },
                    { id: 'losers', label: 'Decliners' },
                  ].map((f) => {
                    const isActive = assetFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setAssetFilter(f.id as any)}
                        className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                          isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sort & View Mode Controls */}
                <div className="flex items-center gap-2 ml-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none"
                  >
                    <option value="change">% Change</option>
                    <option value="price">Price</option>
                    <option value="symbol">Symbol</option>
                    <option value="volume">Volume</option>
                  </select>

                  <div className="flex bg-slate-800 p-0.5 rounded border border-slate-700 font-mono">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-2.5 py-0.5 text-xs rounded font-semibold ${
                        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-2.5 py-0.5 text-xs rounded font-semibold ${
                        viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Matrix
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAssets.map((asset) =>
                    asset.isCrypto ? (
                      <CryptoCard
                        key={asset.symbol}
                        crypto={{
                          id: asset.symbol.toLowerCase(),
                          symbol: asset.symbol.toLowerCase(),
                          name: asset.name,
                          current_price: asset.price,
                          price_change_24h: asset.change,
                          price_change_percentage_24h: asset.changePercent,
                          high_24h: asset.high,
                          low_24h: asset.low,
                          total_volume: asset.volume,
                          market_cap: asset.volume * 100,
                        }}
                        onClick={(sym) => {
                          handleSelectStockAndOpenModal(sym.toUpperCase());
                        }}
                      />
                    ) : (
                      <StockCard
                        key={asset.symbol}
                        stock={asset}
                        onClick={handleSelectStockAndOpenModal}
                      />
                    )
                  )}
                </div>
              )}

              {/* Matrix Table View */}
              {viewMode === 'table' && (
                <div className="glass-panel overflow-hidden border border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Symbol</th>
                          <th className="p-3">Asset Name</th>
                          <th className="p-3 text-right">Spot Price</th>
                          <th className="p-3 text-right">24h Move</th>
                          <th className="p-3 text-right">24h High / Low</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                        {filteredAssets.map((asset) => {
                          const isPos = asset.change >= 0;
                          return (
                            <tr
                              key={asset.symbol}
                              onClick={() => handleSelectStockAndOpenModal(asset.symbol)}
                              className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                            >
                              <td className="p-3 font-bold text-white text-sm tracking-tight">{asset.symbol}</td>
                              <td className="p-3 text-slate-300 font-sans">{asset.name}</td>
                              <td className="p-3 text-right font-bold text-white text-sm">${asset.price.toFixed(2)}</td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isPos ? 'pill-green' : 'pill-red'}`}>
                                  {isPos ? '+' : ''}{asset.changePercent.toFixed(2)}%
                                </span>
                              </td>
                              <td className="p-3 text-right text-slate-400">
                                ${asset.low.toFixed(2)} – ${asset.high.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PREDICT TAB */}
          {activeTab === 'predict' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Quantitative Projection Engine</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Selected Asset: <span className="text-blue-400 font-bold">{selectedStock}</span></p>
                </div>

                <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono">
                  {stocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock.symbol)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        selectedStock === stock.symbol ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {stock.symbol}
                    </button>
                  ))}
                </div>
              </div>

              <PredictionPanel symbol={selectedStock} />
            </div>
          )}
        </main>
      </div>

      {/* Stock Detail Popover Modal */}
      <StockDetailModal
        stock={modalStock}
        onClose={() => setModalStock(null)}
        onNavigateToChart={(sym) => {
          setSelectedStock(sym);
        }}
        onNavigateToPredict={(sym) => {
          setSelectedStock(sym);
          setActiveTab('predict');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090D14] py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500 font-mono">
          <div>© {new Date().getFullYear()} StockLab Platform • Institutional Proxy Terminal</div>
          <div className="flex items-center gap-3 text-slate-400 font-mono">
            <span>Alpha Vantage Proxy</span>
            <span>•</span>
            <span>Finnhub Proxy</span>
            <span>•</span>
            <span>CoinGecko Proxy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;