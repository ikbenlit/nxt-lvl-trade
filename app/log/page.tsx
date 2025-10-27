/**
 * Trade Log Page
 *
 * Display all trades in a table with filters, sorting, and detail view.
 *
 * Features:
 * - Filterable by asset, status, date range
 * - Sortable columns
 * - Pagination (50 per page)
 * - Trade detail modal
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { type Trade } from '@/lib/db';

export default function TradeLogPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Filters
  const [assetFilter, setAssetFilter] = useState<'all' | 'SOL-PERP' | 'BTC-PERP'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'cancelled'>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<keyof Trade>('entryTimestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Fetch trades
  useEffect(() => {
    const fetchTrades = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (assetFilter !== 'all') params.append('asset', assetFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);

        const response = await fetch(`/api/trades?${params}`);
        if (!response.ok) throw new Error('Failed to fetch trades');

        const data = await response.json();
        setTrades(data.trades);
      } catch (error) {
        console.error('Error fetching trades:', error);
        toast.error('Failed to load trades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [assetFilter, statusFilter]);

  // Sort trades
  const sortedTrades = [...trades].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // For dates (timestamps)
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDir === 'asc'
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }

    return 0;
  });

  // Handle sort
  const handleSort = (column: keyof Trade) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format price
  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Trade Log</h1>
          <p className="text-muted-foreground mt-1">
            {trades.length} trade{trades.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button onClick={() => (window.location.href = '/calculator')}>
          + New Trade
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Asset</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={assetFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setAssetFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={assetFilter === 'SOL-PERP' ? 'default' : 'outline'}
                onClick={() => setAssetFilter('SOL-PERP')}
                size="sm"
              >
                SOL
              </Button>
              <Button
                variant={assetFilter === 'BTC-PERP' ? 'default' : 'outline'}
                onClick={() => setAssetFilter('BTC-PERP')}
                size="sm"
              >
                BTC
              </Button>
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'open' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('open')}
                size="sm"
              >
                Open
              </Button>
              <Button
                variant={statusFilter === 'closed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('closed')}
                size="sm"
              >
                Closed
              </Button>
            </div>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setAssetFilter('all');
                setStatusFilter('all');
              }}
              size="sm"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Trade Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading trades...
          </div>
        ) : sortedTrades.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No trades found. Click "New Trade" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    ID
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('asset')}
                  >
                    Asset {sortBy === 'asset' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('direction')}
                  >
                    Direction {sortBy === 'direction' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('entryPrice')}
                  >
                    Entry {sortBy === 'entryPrice' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Exit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    P&L %
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('entryTimestamp')}
                  >
                    Date {sortBy === 'entryTimestamp' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    <td className="px-4 py-3 text-sm font-mono">#{trade.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{trade.asset.replace('-PERP', '')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={trade.direction === 'long' ? 'default' : 'destructive'}>
                        {trade.direction.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {formatPrice(trade.entryPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {formatPrice(trade.exitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {trade.pnlPct !== null ? (
                        <span className={trade.pnlPct > 0 ? 'text-green-600' : 'text-red-600'}>
                          {trade.pnlPct > 0 ? '+' : ''}
                          {trade.pnlPct.toFixed(2)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <Badge
                        variant={
                          trade.status === 'open'
                            ? 'default'
                            : trade.status === 'closed'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {trade.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(trade.entryTimestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Trade Detail Modal (Simple version for now) */}
      {selectedTrade && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTrade(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Trade #{selectedTrade.id}</h2>
                <p className="text-muted-foreground">
                  {selectedTrade.asset} · {selectedTrade.direction.toUpperCase()}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedTrade(null)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entry Price</Label>
                  <p className="text-lg font-mono">{formatPrice(selectedTrade.entryPrice)}</p>
                </div>
                <div>
                  <Label>Exit Price</Label>
                  <p className="text-lg font-mono">{formatPrice(selectedTrade.exitPrice)}</p>
                </div>
                <div>
                  <Label>Stop Loss</Label>
                  <p className="text-lg font-mono">{formatPrice(selectedTrade.stopLoss)}</p>
                </div>
                <div>
                  <Label>Position Size</Label>
                  <p className="text-lg font-mono">
                    {selectedTrade.entrySize} {selectedTrade.asset.replace('-PERP', '')}
                  </p>
                </div>
              </div>

              <div>
                <Label>Targets</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Target 1</p>
                    <p className="font-mono">{formatPrice(selectedTrade.target1)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Target 2</p>
                    <p className="font-mono">{formatPrice(selectedTrade.target2)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Target 3</p>
                    <p className="font-mono">{formatPrice(selectedTrade.target3)}</p>
                  </div>
                </div>
              </div>

              {selectedTrade.status === 'closed' && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>P&L Percentage</Label>
                      <p
                        className={`text-2xl font-bold ${
                          (selectedTrade.pnlPct || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {selectedTrade.pnlPct !== null
                          ? `${selectedTrade.pnlPct > 0 ? '+' : ''}${selectedTrade.pnlPct.toFixed(2)}%`
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <Label>P&L USD</Label>
                      <p
                        className={`text-2xl font-bold ${
                          (selectedTrade.pnlUsd || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {selectedTrade.pnlUsd !== null
                          ? `${selectedTrade.pnlUsd > 0 ? '+' : ''}$${selectedTrade.pnlUsd.toFixed(2)}`
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Label>Status</Label>
                <div className="flex gap-2 mt-2">
                  <Badge variant={selectedTrade.status === 'open' ? 'default' : 'secondary'}>
                    {selectedTrade.status.toUpperCase()}
                  </Badge>
                  {selectedTrade.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.info('Close trade feature coming soon');
                      }}
                    >
                      Close Trade
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
