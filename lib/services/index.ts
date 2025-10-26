/**
 * Services - Barrel Export
 *
 * Business logic and external API integrations.
 * Import services from here throughout the application.
 *
 * @example
 * import { strategyEngine, claudeService } from '@/lib/services';
 */

export {
  StrategyEngine,
  strategyEngine,
  type DriftMarketData,
  type DriftCandle,
  type ConfluenceResult,
  type PositionCalculation,
} from './strategy-engine.service';

export {
  ClaudeService,
  claudeService,
  type ChatParams,
  type ChatResponse,
} from './claude.service';

export {
  DriftService,
  driftService,
  type DriftAsset,
  type DriftOrderbook,
  type DriftLiquidity,
} from './drift.service';
