/**
 * Repository Test Script
 *
 * Manual test script to verify repository functionality.
 * Run with: pnpm tsx lib/db/repositories/test-repositories.ts
 */

import { tradesRepository, conversationsRepository } from './index';

async function testTradesRepository() {
  console.log('\n🧪 Testing TradesRepository...\n');

  try {
    // 1. Create a trade
    console.log('1️⃣  Creating a new trade...');
    const newTrade = await tradesRepository.create({
      asset: 'SOL-PERP',
      direction: 'long',
      entryPrice: 138.5,
      entryTimestamp: new Date(),
      entrySize: 250,
      leverage: 10,
      stopLoss: 136.5,
      target1: 142,
      target2: 145,
      target3: 150,
      confluenceScore: 5,
      confluenceFactors: {
        rsi: true,
        fvg: true,
        oi_divergence: true,
        orderblock: true,
        liquidation_cluster: true,
        funding_rate: false,
      },
      userReasoning: 'FVG retest + RSI oversold + OI divergence',
      emotionalNotes: 'Felt confident, waited for confirmation',
      claudeSetupAnalysis: 'Strong setup with 5/6 confluence factors',
      claudeConfidence: 'HIGH',
      status: 'open',
    });
    console.log(`   ✅ Trade created: ID ${newTrade.id}\n`);

    // 2. Get trade by ID
    console.log('2️⃣  Fetching trade by ID...');
    const fetchedTrade = await tradesRepository.getById(newTrade.id);
    console.log(`   ✅ Trade fetched: ${fetchedTrade?.asset} @ $${fetchedTrade?.entryPrice}\n`);

    // 3. Get all open trades
    console.log('3️⃣  Fetching all open trades...');
    const openTrades = await tradesRepository.getOpenTrades();
    console.log(`   ✅ Found ${openTrades.length} open trade(s)\n`);

    // 4. Close the trade
    console.log('4️⃣  Closing trade at target 1...');
    const closedTrade = await tradesRepository.closeTrade(
      newTrade.id,
      142, // Exit at target 1
      'target_1'
    );
    console.log(`   ✅ Trade closed with ${closedTrade.pnlPct?.toFixed(2)}% P&L\n`);

    // 5. Get statistics
    console.log('5️⃣  Calculating trading statistics...');
    const stats = await tradesRepository.getStatistics();
    console.log(`   ✅ Stats: ${stats.totalTrades} trades, ${stats.winRate.toFixed(1)}% win rate\n`);

    // 6. Count by status
    console.log('6️⃣  Counting trades by status...');
    const counts = await tradesRepository.countByStatus();
    console.log(`   ✅ Open: ${counts.open}, Closed: ${counts.closed}, Cancelled: ${counts.cancelled}\n`);

    // 7. Delete the test trade
    console.log('7️⃣  Deleting test trade...');
    await tradesRepository.delete(newTrade.id);
    console.log(`   ✅ Trade deleted\n`);

    console.log('✅ TradesRepository tests PASSED!\n');
  } catch (error) {
    console.error('❌ TradesRepository tests FAILED:', error);
    throw error;
  }
}

async function testConversationsRepository() {
  console.log('\n🧪 Testing ConversationsRepository...\n');

  try {
    // 1. Create a thread with initial message
    console.log('1️⃣  Creating conversation thread with message...');
    const { thread, message } = await conversationsRepository.createThreadWithMessage(
      {
        topic: 'SOL Setup Analysis',
        asset: 'SOL-PERP',
      },
      {
        role: 'user',
        content: 'SOL at $138, is this a good setup?',
      }
    );
    console.log(`   ✅ Thread created: ID ${thread.id}\n`);

    // 2. Add assistant response
    console.log('2️⃣  Adding assistant message...');
    const assistantMsg = await conversationsRepository.addMessage({
      threadId: thread.id,
      role: 'assistant',
      content: 'Let me analyze this setup for you...',
      model: 'claude-3-5-sonnet-20250219',
      tokensUsed: 150,
      toolsUsed: [
        {
          name: 'fetch_drift_data',
          input: { asset: 'SOL-PERP' },
          output: { price: 138.5, rsi: 34 },
        },
      ],
    });
    console.log(`   ✅ Message added: ID ${assistantMsg.id}\n`);

    // 3. Get thread with messages
    console.log('3️⃣  Fetching thread with all messages...');
    const threadData = await conversationsRepository.getThreadWithMessages(thread.id);
    console.log(`   ✅ Thread has ${threadData?.messages.length} message(s)\n`);

    // 4. Get recent threads
    console.log('4️⃣  Fetching recent threads...');
    const recentThreads = await conversationsRepository.getRecentThreads(5);
    console.log(`   ✅ Found ${recentThreads.length} recent thread(s)\n`);

    // 5. Get conversation stats
    console.log('5️⃣  Calculating conversation stats...');
    const stats = await conversationsRepository.getConversationStats();
    console.log(
      `   ✅ Stats: ${stats.totalThreads} threads, ${stats.totalMessages} messages, ` +
      `${stats.avgMessagesPerThread.toFixed(1)} avg msgs/thread\n`
    );

    // 6. Get token usage
    console.log('6️⃣  Calculating token usage...');
    const tokenUsage = await conversationsRepository.getTotalTokenUsage();
    console.log(
      `   ✅ Token usage: ${tokenUsage.totalTokens} tokens, ` +
      `${tokenUsage.avgTokensPerMessage.toFixed(0)} avg/msg\n`
    );

    // 7. Get most used tools
    console.log('7️⃣  Finding most used tools...');
    const tools = await conversationsRepository.getMostUsedTools();
    if (tools.length > 0) {
      console.log(`   ✅ Top tool: ${tools[0].toolName} (used ${tools[0].count} times)\n`);
    } else {
      console.log(`   ✅ No tools used yet\n`);
    }

    // 8. Delete thread
    console.log('8️⃣  Deleting test thread...');
    await conversationsRepository.deleteThread(thread.id);
    console.log(`   ✅ Thread deleted (messages cascade deleted)\n`);

    console.log('✅ ConversationsRepository tests PASSED!\n');
  } catch (error) {
    console.error('❌ ConversationsRepository tests FAILED:', error);
    throw error;
  }
}

async function runAllTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('🚀 Repository Test Suite');
  console.log('═══════════════════════════════════════════════');

  try {
    await testTradesRepository();
    await testConversationsRepository();

    console.log('═══════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.log('\n═══════════════════════════════════════════════');
    console.log('💥 TESTS FAILED!');
    console.log('═══════════════════════════════════════════════\n');

    process.exit(1);
  }
}

// Run tests
runAllTests();
