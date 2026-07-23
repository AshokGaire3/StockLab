import React from 'react';
import { SortAsc, SortDesc, LayoutGrid, Table } from 'lucide-react';

interface FilterControlsProps {
  sortBy: 'symbol' | 'price' | 'change' | 'volume';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'symbol' | 'price' | 'change' | 'volume', sortOrder: 'asc' | 'desc') => void;
  filterBy: 'all' | 'gainers' | 'losers';
  onFilterChange: (filter: 'all' | 'gainers' | 'losers') => void;
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (view: 'grid' | 'table') => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  filterBy,
  onFilterChange,
  viewMode = 'grid',
  onViewModeChange,
}) => {
  const sortOptions = [
    { value: 'change', label: '% Change' },
    { value: 'price', label: 'Price' },
    { value: 'symbol', label: 'Symbol' },
    { value: 'volume', label: 'Volume' },
  ] as const;

  const filterOptions = [
    { value: 'all', label: 'All Assets' },
    { value: 'gainers', label: 'Top Gainers' },
    { value: 'losers', label: 'Top Losers' },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
      {/* Filter Category Segmented Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {filterOptions.map((option) => {
          const isActive = filterBy === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Sort & View Mode Switches */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any, sortOrder)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
        </div>

        {/* Grid / Table View Switcher */}
        {onViewModeChange && (
          <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};