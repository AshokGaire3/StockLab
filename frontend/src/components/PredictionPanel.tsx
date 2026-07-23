import React, { useEffect, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { Loader2, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PredictionResult } from '../types/financial';
import { financialApi } from '../services/financialApi';
import { TodayShowcase } from './TodayShowcase';

const ACTUAL = '#3B82F6';
const FORECAST = '#6366F1';

interface Row {
  date: string;
  actual?: number;
  predicted?: number;
  band?: [number, number];
}

const TrendIcon = ({ trend }: { trend: PredictionResult['trend'] }) =>
  trend === 'up' ? (
    <TrendingUp className="w-5 h-5 text-emerald-400" />
  ) : trend === 'down' ? (
    <TrendingDown className="w-5 h-5 text-red-400" />
  ) : (
    <Minus className="w-5 h-5 text-slate-400" />
  );

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="glass-panel rounded-xl p-4 border border-slate-800">
    <div className="text-slate-400 text-xs mb-1">{label}</div>
    <div className="text-white text-lg font-semibold font-mono">{value}</div>
  </div>
);

export const PredictionPanel: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [view, setView] = useState<'daily' | 'today'>('daily');
  const [horizon, setHorizon] = useState(7);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await financialApi.getPrediction(symbol, horizon);

        const actualRows: Row[] = result.history.map((point) => ({ date: point.date, actual: point.price }));
        const last = actualRows[actualRows.length - 1];
        if (last?.actual !== undefined) {
          last.predicted = last.actual;
          last.band = [last.actual, last.actual];
        }
        setRows([
          ...actualRows,
          ...result.forecast.map((point) => ({
            date: point.date,
            predicted: point.predicted,
            band: [point.lower, point.upper] as [number, number],
          })),
        ]);
        setPrediction(result);
      } catch (err) {
        console.error('Failed to load prediction:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prediction');
        setPrediction(null);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [symbol, horizon]);

  const viewToggle = (
    <div className="flex gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit mb-4">
      {(['daily', 'today'] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {v === 'daily' ? 'Daily Forecast' : 'Intraday (Hourly)'}
        </button>
      ))}
    </div>
  );

  if (view === 'today') {
    return (
      <div className="space-y-6">
        {viewToggle}
        <TodayShowcase symbol={symbol} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {viewToggle}
        <div className="glass-panel rounded-xl p-6 border border-slate-800 h-96 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span>Computing model forecast for {symbol}...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="space-y-6">
        {viewToggle}
        <div className="glass-panel rounded-xl p-6 border border-slate-800 h-96 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-400 font-medium mb-1">{error}</p>
            <p className="text-slate-500 text-sm">No forecast model available for {symbol}.</p>
          </div>
        </div>
      </div>
    );
  }

  const target = prediction.forecast[prediction.forecast.length - 1];
  const changePercent = ((target.predicted - prediction.current_price) / prediction.current_price) * 100;
  const actualGradientId = `predActualGradient-${symbol}`;
  const bandGradientId = `predBandGradient-${symbol}-${horizon}`;

  return (
    <div className="space-y-6">
      {viewToggle}

      <div className="glass-panel rounded-xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white tracking-tight">{symbol} Forecast</h3>
              <span className="text-xs text-slate-400 font-mono">model: {prediction.model}</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">Projected price trajectory with 95% confidence interval</p>
          </div>

          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setHorizon(days)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  horizon === days
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id={actualGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACTUAL} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={ACTUAL} stopOpacity={0} />
                </linearGradient>
                {/* Fades left-to-right so the band reads as "less certain the
                    further out it projects", not a flat block of color. */}
                <linearGradient id={bandGradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={FORECAST} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={FORECAST} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  try {
                    return format(new Date(value), 'MMM dd');
                  } catch {
                    return value;
                  }
                }}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[(min: number) => min * 0.98, (max: number) => max * 1.02]}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  padding: '8px 12px',
                }}
                itemStyle={{ color: '#E5E7EB' }}
                labelFormatter={(label) => {
                  try {
                    return format(new Date(label), 'MMM dd, yyyy');
                  } catch {
                    return label;
                  }
                }}
                formatter={(value, name) => {
                  if (name === '95% confidence' && Array.isArray(value)) {
                    return [`$${value[0].toFixed(2)} – $${value[1].toFixed(2)}`, name];
                  }
                  return [`$${Number(value).toFixed(2)}`, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => <span className="text-slate-400">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="band"
                name="95% confidence"
                stroke="none"
                fill={`url(#${bandGradientId})`}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="actual"
                name="Historical"
                stroke={ACTUAL}
                strokeWidth={2}
                fill={`url(#${actualGradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: ACTUAL, stroke: '#0F172A', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Forecast"
                stroke={FORECAST}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 4, fill: FORECAST, stroke: '#0F172A', strokeWidth: 2 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="text-slate-400 text-xs mb-1">Price in {prediction.horizon_days} days</div>
          <div className="flex items-center gap-2">
            <TrendIcon trend={prediction.trend} />
            <span className="text-white text-lg font-semibold font-mono">${target.predicted.toFixed(2)}</span>
            <span className={`text-xs font-semibold ${changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <Stat
          label={`Average Error (${prediction.horizon_days}d)`}
          value={prediction.accuracy ? `±${prediction.accuracy.mape.toFixed(1)}%` : 'Measuring...'}
        />
        <Stat label="RSI (14)" value={prediction.indicators.rsi_14?.toFixed(1) ?? '—'} />
        <Stat
          label="Volatility (Annualized)"
          value={
            prediction.indicators.volatility !== null
              ? `${(prediction.indicators.volatility * 100).toFixed(1)}%`
              : '—'
          }
        />
      </div>

      {prediction.accuracy && prediction.accuracy.beats_baseline && (
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 text-xs font-semibold">Model Beats Baseline "No-Change" Benchmark</p>
            <p className="text-emerald-200/70 text-xs mt-0.5">
              {prediction.accuracy.mape.toFixed(1)}% average error vs {prediction.accuracy.baseline_mape.toFixed(1)}% baseline over {prediction.accuracy.n_forecasts.toLocaleString()} backtested forecasts.
            </p>
          </div>
        </div>
      )}

      {prediction.accuracy && !prediction.accuracy.beats_baseline && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-xs font-semibold">Model Performs Similarly to Flat Baseline</p>
            <p className="text-amber-200/70 text-xs mt-0.5">
              {prediction.accuracy.mape.toFixed(1)}% error vs {prediction.accuracy.baseline_mape.toFixed(1)}% baseline over {prediction.accuracy.n_forecasts.toLocaleString()} forecasts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
