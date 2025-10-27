/**
 * ConfluenceDisplay Component
 *
 * Shows confluence score (0-6) with detailed factor breakdown.
 * Used in:
 * - Chat sidebar (real-time context)
 * - Message bubbles (Claude responses)
 * - Dashboard (quick scan)
 * - Calculator (setup validation)
 *
 * Visual:
 * - Score: 5-6 = green (high conviction)
 * - Score: 4 = yellow (medium conviction)
 * - Score: 0-3 = red (low conviction, skip)
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export interface ConfluenceFactors {
  rsi_oversold_bought: boolean;
  support_resistance: boolean;
  oi_divergence: boolean;
  fvg_present: boolean;
  order_block: boolean;
  funding_extreme: boolean;
}

export interface ConfluenceDisplayProps {
  score: number; // 0-6
  factors: ConfluenceFactors;
  showDetails?: boolean;
  variant?: 'default' | 'compact' | 'card';
  className?: string;
}

export function ConfluenceDisplay({
  score,
  factors,
  showDetails = true,
  variant = 'default',
  className,
}: ConfluenceDisplayProps) {
  const getColor = (score: number) => {
    if (score >= 5) return 'text-green-600 dark:text-green-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 5) return 'default';
    if (score >= 4) return 'secondary';
    return 'destructive';
  };

  const stars = '⭐'.repeat(score);
  const conviction = score >= 5 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW';

  // Card variant (full featured)
  if (variant === 'card') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Confluence Score</h3>
            <Badge variant={getBadgeVariant(score)}>
              {conviction} ({score}/6)
            </Badge>
          </div>

          {/* Stars */}
          <div className="text-2xl">{stars}</div>

          {/* Factor Breakdown */}
          {showDetails && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Factors
              </p>
              <div className="space-y-1">
                <FactorItem
                  checked={factors.rsi_oversold_bought}
                  label="RSI oversold/overbought"
                  description="14-period RSI < 30 or > 70"
                />
                <FactorItem
                  checked={factors.support_resistance}
                  label="Near support/resistance"
                  description="Price within 1% of key level"
                />
                <FactorItem
                  checked={factors.oi_divergence}
                  label="OI divergence"
                  description="Price down + OI up (capitulation)"
                />
                <FactorItem
                  checked={factors.fvg_present}
                  label="Fair Value Gap"
                  description="Unfilled gap from large move"
                />
                <FactorItem
                  checked={factors.order_block}
                  label="Order Block"
                  description="Strong rejection from zone"
                />
                <FactorItem
                  checked={factors.funding_extreme}
                  label="Extreme funding"
                  description="Funding rate > ±0.03%"
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Compact variant (for tight spaces)
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Confluence</span>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-bold', getColor(score))}>
              {score}/6
            </span>
            <span className="text-sm">{stars}</span>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-0.5 text-xs">
            <FactorItem checked={factors.rsi_oversold_bought} label="RSI" compact />
            <FactorItem checked={factors.support_resistance} label="S/R" compact />
            <FactorItem checked={factors.oi_divergence} label="OI div" compact />
            <FactorItem checked={factors.fvg_present} label="FVG" compact />
            <FactorItem checked={factors.order_block} label="OB" compact />
            <FactorItem checked={factors.funding_extreme} label="Funding" compact />
          </div>
        )}
      </div>
    );
  }

  // Default variant (sidebar, detailed)
  return (
    <div className={cn('space-y-3', className)}>
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Confluence Score</span>
        <div className="flex items-center gap-2">
          <span className={cn('text-xl font-bold', getColor(score))}>
            {score}/6
          </span>
          <span>{stars}</span>
        </div>
      </div>

      {/* Conviction Badge */}
      <Badge variant={getBadgeVariant(score)} className="w-full justify-center">
        {conviction} CONVICTION
      </Badge>

      {/* Factor Checklist */}
      {showDetails && (
        <div className="space-y-1 text-sm">
          <FactorItem checked={factors.rsi_oversold_bought} label="RSI oversold/overbought" />
          <FactorItem checked={factors.support_resistance} label="Near support/resistance" />
          <FactorItem checked={factors.oi_divergence} label="OI divergence" />
          <FactorItem checked={factors.fvg_present} label="Fair Value Gap" />
          <FactorItem checked={factors.order_block} label="Order Block" />
          <FactorItem checked={factors.funding_extreme} label="Extreme funding" />
        </div>
      )}
    </div>
  );
}

/**
 * Individual factor item with checkbox
 */
function FactorItem({
  checked,
  label,
  description,
  compact = false,
}: {
  checked: boolean;
  label: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex items-start gap-2', compact && 'items-center')}>
      <span className={checked ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
        {checked ? '✅' : '❌'}
      </span>
      <div className="flex-1">
        <span className={cn(
          compact ? 'text-xs' : 'text-sm',
          checked ? '' : 'text-muted-foreground line-through opacity-60'
        )}>
          {label}
        </span>
        {description && !compact && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Helper: Calculate confluence score from factors
 */
export function calculateConfluenceScore(factors: ConfluenceFactors): number {
  return Object.values(factors).filter(Boolean).length;
}

/**
 * Helper: Get conviction level from score
 */
export function getConvictionLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 5) return 'HIGH';
  if (score >= 4) return 'MEDIUM';
  return 'LOW';
}
