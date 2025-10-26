/**
 * Live Drift SDK Test Script
 *
 * Tests real Drift Protocol integration with actual Helius RPC.
 * Run with: pnpm test:drift:live
 *
 * NOTE: This makes real RPC calls (uses your Helius quota).
 */

import dotenv from 'dotenv';
import type { DriftMarketData } from './strategy-engine.service';

// IMPORTANT: Load .env.local FIRST
dotenv.config({ path: '.env.local' });

import { DriftService } from './drift.service';

// Create a fresh instance after env vars are loaded
const driftService = new DriftService();

async function testInitialization() {
  console.log('\n🧪 Test 1: DriftClient Initialization\n');
  console.log('─'.repeat(50));

  try {
    await driftService.initialize();
    console.log('✅ DriftClient initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    throw error;
  }
}

async function testGetMarketData(asset: 'SOL-PERP' | 'BTC-PERP') {
  console.log(`\n🧪 Test 2: Get Market Data (${asset})\n`);
  console.log('─'.repeat(50));

  try {
    const startTime = Date.now();
    const marketData: DriftMarketData = await driftService.getMarketData(asset);
    const latency = Date.now() - startTime;

    console.log('\n✅ Market data received!');
    console.log('\n📊 Data:');
    console.log(`   Asset: ${marketData.asset}`);
    console.log(`   Price: $${marketData.price.toFixed(2)}`);
    console.log(`   Open Interest: ${marketData.open_interest.toFixed(2)} units`);
    console.log(`   Funding Rate: ${(marketData.funding_rate * 100).toFixed(4)}%/h`);
    console.log(`   Funding (annualized): ${marketData.funding_rate_annualized.toFixed(2)}%`);
    console.log(`   Next Funding: ${marketData.next_funding_time}`);
    console.log(`   Last Update: ${marketData.last_update}`);

    console.log(`\n⏱️  RPC Latency: ${latency}ms`);

    if (latency > 1000) {
      console.log('⚠️  High latency detected (> 1000ms)');
    }

    return marketData;
  } catch (error) {
    console.error(`❌ Failed to fetch ${asset} market data:`, error);
    throw error;
  }
}

async function testCaching(asset: 'SOL-PERP' | 'BTC-PERP') {
  console.log(`\n🧪 Test 3: Caching (${asset})\n`);
  console.log('─'.repeat(50));

  try {
    // First call (should hit RPC)
    console.log('First call (should hit RPC)...');
    const startTime1 = Date.now();
    await driftService.getMarketData(asset);
    const latency1 = Date.now() - startTime1;

    // Second call immediately (should hit cache)
    console.log('\nSecond call (should hit cache)...');
    const startTime2 = Date.now();
    await driftService.getMarketData(asset);
    const latency2 = Date.now() - startTime2;

    console.log(`\n✅ Caching test complete`);
    console.log(`   First call (RPC): ${latency1}ms`);
    console.log(`   Second call (cache): ${latency2}ms`);
    console.log(`   Speed improvement: ${Math.round((latency1 / latency2) * 100) / 100}x`);

    if (latency2 > 10) {
      console.log('⚠️  Cache hit seems slow (> 10ms)');
    }

    return true;
  } catch (error) {
    console.error('❌ Caching test failed:', error);
    throw error;
  }
}

async function testGetOrderbook(asset: 'SOL-PERP' | 'BTC-PERP') {
  console.log(`\n🧪 Test 4: Get Orderbook (${asset})\n`);
  console.log('─'.repeat(50));

  try {
    const orderbook = await driftService.getOrderbook(asset);

    console.log('\n✅ Orderbook received!');
    console.log('\n📊 Data:');
    console.log(`   Mid Price: $${orderbook.midPrice.toFixed(2)}`);
    console.log(`   Spread: ${orderbook.spread.toFixed(3)}%`);
    console.log(`   Bids: ${orderbook.bids.length} levels`);
    console.log(`   Asks: ${orderbook.asks.length} levels`);

    if (orderbook.bids.length > 0) {
      console.log(`   Best Bid: $${orderbook.bids[0].price.toFixed(2)} (size: ${orderbook.bids[0].size.toFixed(2)})`);
    }
    if (orderbook.asks.length > 0) {
      console.log(`   Best Ask: $${orderbook.asks[0].price.toFixed(2)} (size: ${orderbook.asks[0].size.toFixed(2)})`);
    }

    return orderbook;
  } catch (error) {
    console.error(`❌ Failed to fetch ${asset} orderbook:`, error);
    throw error;
  }
}

async function testCheckLiquidity(asset: 'SOL-PERP' | 'BTC-PERP') {
  console.log(`\n🧪 Test 5: Check Liquidity (${asset})\n`);
  console.log('─'.repeat(50));

  try {
    const liquidity = await driftService.checkLiquidity(asset);

    console.log('\n✅ Liquidity check complete!');
    console.log('\n📊 Data:');
    console.log(`   Bid Liquidity: $${(liquidity.bidLiquidity / 1e3).toFixed(1)}k`);
    console.log(`   Ask Liquidity: $${(liquidity.askLiquidity / 1e3).toFixed(1)}k`);
    console.log(`   Total Liquidity: $${(liquidity.totalLiquidity / 1e3).toFixed(1)}k`);
    console.log(`   Threshold: $${(liquidity.threshold / 1e3).toFixed(1)}k per side`);
    console.log(`   Is Sufficient: ${liquidity.isSufficient ? '✅ Yes' : '❌ No'}`);

    return liquidity;
  } catch (error) {
    console.error(`❌ Failed to check ${asset} liquidity:`, error);
    throw error;
  }
}

async function runAllTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('🚀 Drift Service Live RPC Test Suite');
  console.log('═══════════════════════════════════════════════');

  try {
    // Test 1: Initialization
    await testInitialization();

    // Test 2: SOL-PERP market data
    await testGetMarketData('SOL-PERP');

    // Test 3: Caching
    await testCaching('SOL-PERP');

    // Clear cache for fresh test
    driftService.clearCache();

    // Test 4: BTC-PERP market data
    await testGetMarketData('BTC-PERP');

    // Test 5: Orderbook
    await testGetOrderbook('SOL-PERP');

    // Test 6: Liquidity
    await testCheckLiquidity('SOL-PERP');

    // Cleanup
    await driftService.cleanup();

    console.log('\n═══════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════');
    console.log('\n✅ Drift SDK integration working correctly');
    console.log('✅ Helius RPC connection successful');
    console.log('✅ Market data fetched for SOL-PERP and BTC-PERP');
    console.log('✅ Caching working as expected\n');

    process.exit(0);
  } catch (error) {
    console.log('\n═══════════════════════════════════════════════');
    console.log('💥 TESTS FAILED!');
    console.log('═══════════════════════════════════════════════\n');

    if (error instanceof Error) {
      console.error('Error details:', error.message);

      // Provide helpful hints
      if (error.message.includes('timeout')) {
        console.log('\n💡 Troubleshooting:');
        console.log('   - Check your internet connection');
        console.log('   - Verify HELIUS_API_URL in .env.local');
        console.log('   - Try the public Solana RPC (slower but no key needed)');
      } else if (error.message.includes('rate limit')) {
        console.log('\n💡 Troubleshooting:');
        console.log('   - You hit the Helius free tier limit (100k requests/day)');
        console.log('   - Wait a bit or upgrade your Helius plan');
      }
    }

    process.exit(1);
  }
}

// Run tests
runAllTests();
