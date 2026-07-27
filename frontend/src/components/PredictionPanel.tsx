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
    <TrendingUp className="w-4 h-4 text-emerald-400" />
  ) : trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-red-400" />
  ) : (
    <Minus className="w-4 h-4 text-slate-400" />
  );

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="glass-panel p-4">
    <div className="text-slate-400 text-xs font-mono mb-1 uppercase tracking-wider">{label}</div>
    <div className="text-white text-base font-bold font-mono tabular-nums">{value}</div>
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
        console.error('Failed to load forecast model:', err);
        setError(err instanceof Error ? err.message : 'Failed to load forecast model');
        setPrediction(null);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [symbol, horizon]);

  const viewToggle = (
    <div className="flex gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 w-fit mb-4">
      {(['daily', 'today'] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
            view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {v === 'daily' ? 'Daily Forecast Model' : 'Intraday Evaluation'}
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
        <div className="glass-panel p-6 h-96 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>Fitting statistical projection model for {symbol}...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="space-y-6">
        {viewToggle}
        <div className="glass-panel p-6 h-96 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-400 font-mono text-xs mb-1">{error}</p>
            <p className="text-slate-500 text-xs">No statistical model available for {symbol}.</p>
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

      <div className="glass-panel p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white tracking-tight">{symbol} Statistical Forecast</h3>
              <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {prediction.model}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-mono mt-0.5">Scored statistical model with 95% confidence bounds</p>
          </div>

          <div className="flex gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setHorizon(days)}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                  horizon === days
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days}D Target
              </button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id={actualGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACTUAL} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={ACTUAL} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={bandGradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={FORECAST} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={FORECAST} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2433" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
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
                stroke="#64748B"
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                axisLine={false}
                domain={[(min: number) => min * 0.98, (max: number) => max * 1.02]}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111722',
                  border: '1px solid #2B3A52',
                  borderRadius: '6px',
                  color: '#E2E8F0',
                  padding: '8px 12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#E2E8F0' }}
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
                wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }}
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
                activeDot={{ r: 4, fill: ACTUAL, stroke: '#090D14', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Forecast"
                stroke={FORECAST}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 4, fill: FORECAST, stroke: '#090D14', strokeWidth: 2 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel p-4">
          <div className="text-slate-400 text-xs font-mono mb-1 uppercase tracking-wider">
            Target ({prediction.horizon_days}D)
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon trend={prediction.trend} />
            <span className="text-white text-base font-bold font-mono tabular-nums">${target.predicted.toFixed(2)}</span>
            <span className={`text-xs font-semibold font-mono tabular-nums ${changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <Stat
          label={`Backtest MAPE (${prediction.horizon_days}d)`}
          value={prediction.accuracy ? `±${prediction.accuracy.mape.toFixed(1)}%` : 'Scoring...'}
        />
        <Stat label="RSI Momentum (14)" value={prediction.indicators.rsi_14?.toFixed(1) ?? '—'} />
        <Stat
          label="Historical Volatility"
          value={
            prediction.indicators.volatility !== null
              ? `${(prediction.indicators.volatility * 100).toFixed(1)}%`
              : '—'
          }
        />
      </div>

      {prediction.accuracy && prediction.accuracy.beats_baseline && (
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 text-xs font-semibold font-mono">Statistical Model Beats Baseline "No-Change" Benchmark</p>
            <p className="text-emerald-200/70 text-xs font-mono mt-0.5 tabular-nums">
              {prediction.accuracy.mape.toFixed(1)}% average error vs {prediction.accuracy.baseline_mape.toFixed(1)}% baseline over {prediction.accuracy.n_forecasts.toLocaleString()} backtested forecasts.
            </p>
          </div>
        </div>
      )}

      {prediction.accuracy && !prediction.accuracy.beats_baseline && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-xs font-semibold font-mono">Model Performs Similarly to Flat Baseline</p>
            <p className="text-amber-200/70 text-xs font-mono mt-0.5 tabular-nums">
              {prediction.accuracy.mape.toFixed(1)}% error vs {prediction.accuracy.baseline_mape.toFixed(1)}% baseline over {prediction.accuracy.n_forecasts.toLocaleString()} forecasts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
