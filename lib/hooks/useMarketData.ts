/**
 * useMarketData Hook
 *
 * Fetches real-time market data for an asset with automatic refresh.
 * Uses SWR for caching, revalidation, and error handling.
 *
 * Features:
 * - Auto-refresh every 30s (configurable)
 * - Optimistic updates (cached data while fetching)
 * - Error handling with retry logic
 * - Manual refresh via mutate()
 *
 * @example
 * const { data, isLoading, error, refresh } = useMarketData('SOL-PERP', '4h');
 */

import useSWR from 'swr';
import { ConfluenceFactors } from '@/components/shared/ConfluenceDisplay';

// ============================================
// TYPES
// ============================================

export interface MarketData {
  asset: 'SOL-PERP' | 'BTC-PERP';
  price: number;
  priceChange24h: number;
  volume24h: number;
  openInterest: number;
  openInterestUsd: number;
  fundingRate: number;
  fundingRateAnnualized: number;
  nextFundingTime: string;
  confluence: {
    score: number;
    conviction: 'HIGH' | 'MEDIUM' | 'LOW';
    factors: ConfluenceFactors;
    details: {
      rsi: number | null;
      supportLevels: number[];
      resistanceLevels: number[];
      fvgZones: Array<{ low: number; high: number }>;
      orderBlocks: Array<{ price: number; type: 'demand' | 'supply' }>;
      fundingRate: number;
    };
  };
  timestamp: string;
  interval: string;
}

export interface UseMarketDataOptions {
  refreshInterval?: number; // milliseconds (default: 30000 = 30s)
  revalidateOnFocus?: boolean; // revalidate when window regains focus (default: true)
  interval?: '1h' | '4h' | '1d'; // timeframe for confluence (default: '4h')
}

export interface UseMarketDataReturn {
  data: MarketData | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>; // Manual refresh
}

// ============================================
// FETCHER
// ============================================

const fetcher = async (url: string): Promise<MarketData> => {
  const res = await fetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
};

// ============================================
// HOOK
// ============================================

export function useMarketData(
  asset: 'SOL-PERP' | 'BTC-PERP',
  options: UseMarketDataOptions = {}
): UseMarketDataReturn {
  const {
    refreshInterval = 30000, // 30s default (swing trading doesn't need < 30s)
    revalidateOnFocus = true,
    interval = '4h',
  } = options;

  // Build API URL with query params
  const url = `/api/market-data?asset=${asset}&interval=${interval}`;

  // SWR hook
  const { data, error, isLoading, mutate } = useSWR<MarketData, Error>(url, fetcher, {
    refreshInterval, // Auto-refresh every N ms
    revalidateOnFocus, // Revalidate when user returns to tab
    dedupingInterval: 5000, // Dedupe requests within 5s (avoid spam)
    errorRetryCount: 3, // Retry failed requests 3x
    errorRetryInterval: 5000, // Wait 5s between retries
    keepPreviousData: true, // Show stale data while revalidating
  });

  // Manual refresh function
  const refresh = async () => {
    await mutate();
  };

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}

// ============================================
// HELPER: Format funding rate for display
// ============================================

export function formatFundingRate(rate: number): string {
  const percentage = (rate * 100).toFixed(4);
  return `${parseFloat(percentage) >= 0 ? '+' : ''}${percentage}%`;
}

// ============================================
// HELPER: Format price change for display
// ============================================

export function formatPriceChange(change: number): string {
  return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
}

// ============================================
// HELPER: Get next funding time (human readable)
// ============================================

export function getTimeUntilFunding(nextFundingTime: string): string {
  const now = new Date();
  const fundingTime = new Date(nextFundingTime);
  const diffMs = fundingTime.getTime() - now.getTime();

  if (diffMs < 0) return 'Overdue';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
