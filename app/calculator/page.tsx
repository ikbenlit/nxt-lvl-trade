/**
 * Position Calculator Page
 *
 * Calculate position sizing, R:R ratio, liquidation price, and risk management.
 * Live calculation updates as user types.
 *
 * Features:
 * - Asset selection (SOL-PERP / BTC-PERP)
 * - Account settings (size + risk %)
 * - Price levels (entry, stop, target)
 * - R:R visualization (bars)
 * - Position sizing results
 * - Liquidation price warning
 * - Log Trade button (future: saves to DB)
 */

'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { strategyEngine } from '@/lib/services/strategy-engine.service';
import { toast } from 'sonner';

export default function CalculatorPage() {
  // Asset state
  const [asset, setAsset] = useState<'SOL-PERP' | 'BTC-PERP'>('SOL-PERP');

  // Account settings
  const [accountSize, setAccountSize] = useState(50000);
  const [riskPct, setRiskPct] = useState(1);

  // Price levels
  const [entryPrice, setEntryPrice] = useState(200);
  const [stopLoss, setStopLoss] = useState(196);
  const [target1, setTarget1] = useState(208);
  const [target2, setTarget2] = useState(212);
  const [target3, setTarget3] = useState(216);

  // Partial exit strategy (percentage of position to close at each target)
  const [exitPct1, setExitPct1] = useState(33); // 33% at T1
  const [exitPct2, setExitPct2] = useState(33); // 33% at T2
  // T3 gets remainder (34%)

  // Leverage (fixed at 10x for Drift)
  const leverage = 10;

  // Suggest levels loading state
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Calculate position (live calculation)
  const calculation = useMemo(() => {
    if (!entryPrice || !stopLoss || entryPrice === stopLoss) {
      return null;
    }

    try {
      return strategyEngine.calculatePosition({
        entry_price: entryPrice,
        stop_loss: stopLoss,
        risk_pct: riskPct,
        account_size: accountSize,
        leverage,
      });
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, [entryPrice, stopLoss, riskPct, accountSize]);

  // Calculate weighted R:R ratio (accounts for partial exits)
  const rrRatio = useMemo(() => {
    if (!entryPrice || !stopLoss) return null;

    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    if (riskPerUnit === 0) return null;

    // Calculate weighted reward based on targets and exit percentages
    let weightedReward = 0;
    let totalExitPct = 0;

    if (target1) {
      const reward1 = Math.abs(target1 - entryPrice);
      weightedReward += (reward1 * exitPct1) / 100;
      totalExitPct += exitPct1;
    }

    if (target2) {
      const reward2 = Math.abs(target2 - entryPrice);
      weightedReward += (reward2 * exitPct2) / 100;
      totalExitPct += exitPct2;
    }

    if (target3) {
      const exitPct3 = 100 - exitPct1 - exitPct2;
      const reward3 = Math.abs(target3 - entryPrice);
      weightedReward += (reward3 * exitPct3) / 100;
      totalExitPct += exitPct3;
    }

    // If no targets set, return null
    if (totalExitPct === 0) return null;

    return weightedReward / riskPerUnit;
  }, [entryPrice, stopLoss, target1, target2, target3, exitPct1, exitPct2]);

  // Calculate risk/reward amounts
  const riskAmount = calculation?.risk_amount_usd || 0;
  const rewardAmount = rrRatio ? riskAmount * rrRatio : 0;

  // Stop distance from entry
  const stopDistancePct = useMemo(() => {
    if (!entryPrice || !stopLoss) return 0;
    return ((Math.abs(entryPrice - stopLoss) / entryPrice) * 100).toFixed(2);
  }, [entryPrice, stopLoss]);

  // Target distances from entry
  const target1DistancePct = useMemo(() => {
    if (!entryPrice || !target1) return 0;
    return ((Math.abs(target1 - entryPrice) / entryPrice) * 100).toFixed(2);
  }, [entryPrice, target1]);

  const target2DistancePct = useMemo(() => {
    if (!entryPrice || !target2) return 0;
    return ((Math.abs(target2 - entryPrice) / entryPrice) * 100).toFixed(2);
  }, [entryPrice, target2]);

  const target3DistancePct = useMemo(() => {
    if (!entryPrice || !target3) return 0;
    return ((Math.abs(target3 - entryPrice) / entryPrice) * 100).toFixed(2);
  }, [entryPrice, target3]);

  // Handlers
  const handleLogTrade = async () => {
    if (!calculation) {
      toast.error('Invalid calculation', {
        description: 'Please enter valid entry and stop loss prices',
      });
      return;
    }

    // Determine trade direction (long/short) based on stop loss position
    const direction: 'long' | 'short' = stopLoss < entryPrice ? 'long' : 'short';

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset,
          direction,
          entryPrice,
          entrySize: calculation.position_size,
          leverage,
          stopLoss,
          target1: target1 || null,
          target2: target2 || null,
          target3: target3 || null,
          // Optional fields (can add later)
          // confluenceScore: null,
          // confluenceFactors: null,
          // userReasoning: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save trade');
      }

      const { trade } = await response.json();

      toast.success('Trade Logged Successfully', {
        description: `${calculation.position_size.toFixed(2)} ${asset.replace('-PERP', '')} ${direction} @ $${entryPrice} (ID: ${trade.id})`,
      });
    } catch (error) {
      console.error('Error logging trade:', error);
      toast.error('Failed to log trade', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleSuggestLevels = async () => {
    setIsSuggesting(true);

    try {
      // Fetch current market data first
      const marketDataRes = await fetch(`/api/market-data?asset=${asset}&interval=4h`);
      if (!marketDataRes.ok) {
        throw new Error('Failed to fetch market data');
      }
      const marketData = await marketDataRes.json();

      // Call Claude to suggest levels
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Based on current ${asset} market data:
- Price: $${marketData.price}
- 24h change: ${marketData.priceChange24hPct}%
- Confluence score: ${marketData.confluenceScore}/6
- RSI: ${marketData.rsi || 'N/A'}
- Support levels: ${marketData.confluenceDetails.support_levels?.slice(0, 3).join(', ') || 'None'}
- Resistance levels: ${marketData.confluenceDetails.resistance_levels?.slice(0, 3).join(', ') || 'None'}

Please suggest entry, stop loss, and 3 target levels for a ${stopLoss < entryPrice ? 'LONG' : 'SHORT'} trade with 1.5:1 minimum R:R.
Format your response as JSON with keys: entry, stop, target1, target2, target3 (all numbers).`,
            },
          ],
          asset,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Claude suggestion');
      }

      // Parse SSE stream for final response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let finalText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                finalText += data.text;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Extract JSON from Claude's response
      const jsonMatch = finalText.match(/\{[^}]*"entry"[^}]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse levels from Claude response');
      }

      const levels = JSON.parse(jsonMatch[0]);

      // Pre-fill the inputs
      setEntryPrice(levels.entry);
      setStopLoss(levels.stop);
      setTarget1(levels.target1);
      setTarget2(levels.target2 || target2);
      setTarget3(levels.target3 || target3);

      toast.success('Levels suggested successfully', {
        description: `Entry: $${levels.entry}, Stop: $${levels.stop}`,
      });
    } catch (error) {
      console.error('Error suggesting levels:', error);
      toast.error('Failed to suggest levels', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCopy = () => {
    if (!calculation) return;

    const text = `
Asset: ${asset}
Entry: $${entryPrice}
Stop: $${stopLoss}
Target 1: $${target1}${target2 ? `\nTarget 2: $${target2}` : ''}${target3 ? `\nTarget 3: $${target3}` : ''}
Position Size: ${calculation.position_size.toFixed(2)} ${asset.replace('-PERP', '')}
R:R: ${rrRatio?.toFixed(2)}:1
Liquidation: $${calculation.liquidation_price.toFixed(2)}
`.trim();

    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Position Calculator</h1>

        {/* Asset Selection */}
        <div className="mb-6">
          <Label>Asset</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={asset === 'SOL-PERP' ? 'default' : 'outline'}
              onClick={() => setAsset('SOL-PERP')}
              className="flex-1"
            >
              SOL-PERP
            </Button>
            <Button
              variant={asset === 'BTC-PERP' ? 'default' : 'outline'}
              onClick={() => setAsset('BTC-PERP')}
              className="flex-1"
            >
              BTC-PERP
            </Button>
          </div>
        </div>

        {/* Account Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="account-size">Account Size</Label>
            <Input
              id="account-size"
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="risk-pct">Risk per Trade</Label>
            <div className="relative mt-2">
              <Input
                id="risk-pct"
                type="number"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              = ${(accountSize * (riskPct / 100)).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Suggest Levels Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleSuggestLevels}
            disabled={isSuggesting}
            className="w-full"
          >
            {isSuggesting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Asking Claude for level suggestions...
              </>
            ) : (
              <>
                <span className="mr-2">🤖</span>
                Suggest Levels (Claude AI)
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Claude will analyze current market data and suggest entry, stop, and target levels
          </p>
        </div>

        {/* Price Levels */}
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="entry-price">Entry Price</Label>
            <Input
              id="entry-price"
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="stop-loss">Stop Loss</Label>
            <Input
              id="stop-loss"
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stopDistancePct}% from entry
            </p>
          </div>

          <div>
            <Label htmlFor="target-1">Target 1</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="target-1"
                type="number"
                step="0.01"
                value={target1}
                onChange={(e) => setTarget1(Number(e.target.value))}
                className="flex-1"
              />
              <div className="relative w-24">
                <Input
                  type="number"
                  step="1"
                  value={exitPct1}
                  onChange={(e) => setExitPct1(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {target1DistancePct}% from entry · Exit {exitPct1}% of position
            </p>
          </div>

          <div>
            <Label htmlFor="target-2">Target 2 (optional)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="target-2"
                type="number"
                step="0.01"
                value={target2}
                onChange={(e) => setTarget2(Number(e.target.value))}
                className="flex-1"
                placeholder="Optional"
              />
              <div className="relative w-24">
                <Input
                  type="number"
                  step="1"
                  value={exitPct2}
                  onChange={(e) => setExitPct2(Math.min(100 - exitPct1, Math.max(0, Number(e.target.value))))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {target2 ? `${target2DistancePct}% from entry · Exit ${exitPct2}% of position` : 'Optional target level'}
            </p>
          </div>

          <div>
            <Label htmlFor="target-3">Target 3 (optional)</Label>
            <Input
              id="target-3"
              type="number"
              step="0.01"
              value={target3}
              onChange={(e) => setTarget3(Number(e.target.value))}
              className="mt-2"
              placeholder="Optional"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {target3 ? `${target3DistancePct}% from entry · Exit ${100 - exitPct1 - exitPct2}% of position` : 'Optional target level'}
            </p>
          </div>
        </div>

        {/* Results (only show if valid calculation) */}
        {calculation && rrRatio && (
          <>
            {/* Risk/Reward Display */}
            <Card className="p-4 bg-muted mb-6">
              <h3 className="font-semibold mb-3">Risk/Reward Analysis</h3>

              {/* Visual bars */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-20 text-sm">Risk:</div>
                  <div
                    className="h-2 bg-red-500 rounded"
                    style={{
                      width: `${(riskAmount / (riskAmount + rewardAmount)) * 100}%`,
                    }}
                  />
                  <div className="text-sm font-mono">${riskAmount.toFixed(0)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 text-sm">Reward:</div>
                  <div
                    className="h-2 bg-green-500 rounded"
                    style={{
                      width: `${(rewardAmount / (riskAmount + rewardAmount)) * 100}%`,
                    }}
                  />
                  <div className="text-sm font-mono">${rewardAmount.toFixed(0)}</div>
                </div>
              </div>

              {/* R:R Ratio */}
              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold">R:R Ratio:</span>
                <Badge variant={rrRatio >= 1.5 ? 'default' : 'destructive'}>
                  {rrRatio.toFixed(2)}:1 {rrRatio >= 1.5 ? '✅' : '❌'}
                </Badge>
              </div>
            </Card>

            {/* Position Size Result */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 mb-6">
              <h3 className="font-semibold mb-3">Position Sizing</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Position Size:</span>
                  <span className="font-bold text-lg">
                    {calculation.position_size.toFixed(2)} {asset.replace('-PERP', '')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Notional Value:</span>
                  <span className="font-mono">
                    ${calculation.notional_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Margin Required (10x):</span>
                  <span className="font-mono">
                    ${calculation.margin_required.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>Liquidation Price:</span>
                  <span className="font-mono">${calculation.liquidation_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Liq Distance:</span>
                  <Badge variant={calculation.liquidation_distance_pct >= 8 ? 'default' : 'destructive'}>
                    {calculation.liquidation_distance_pct.toFixed(1)}%{' '}
                    {calculation.liquidation_distance_pct >= 8 ? '✅' : '⚠️'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Warnings */}
            {calculation.warnings.length > 0 && (
              <Card className="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 mb-6">
                <ul className="space-y-1 text-sm">
                  {calculation.warnings.map((warning, i) => (
                    <li key={i}>⚠️ {warning}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* R:R Warning */}
            {rrRatio < 1.5 && (
              <Card className="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 mb-6">
                <p className="text-sm">⚠️ R:R ratio below 1.5:1 (minimum recommended)</p>
              </Card>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleLogTrade}
            disabled={!calculation || !rrRatio}
          >
            Log Trade
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!calculation}
          >
            Copy
          </Button>
        </div>
      </Card>
    </div>
  );
}
