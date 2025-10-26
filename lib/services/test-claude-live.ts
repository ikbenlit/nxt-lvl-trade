/**
 * Live Claude API Test Script
 *
 * Tests real Claude API integration with actual API key.
 * Run with: pnpm test:claude:live
 *
 * NOTE: This makes real API calls and costs money (small amount).
 */

import dotenv from 'dotenv';
import type Anthropic from '@anthropic-ai/sdk';

// IMPORTANT: Load .env.local FIRST
// We can't use the singleton export because it gets instantiated at module load time
dotenv.config({ path: '.env.local' });

import { ClaudeService } from './claude.service';

// Create a fresh instance after env vars are loaded
const claudeService = new ClaudeService();

async function testNonStreamingChat() {
  console.log('\n🧪 Test 1: Non-Streaming Chat\n');
  console.log('─'.repeat(50));

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: 'Hello! Can you briefly explain what you do as a trading assistant?',
    },
  ];

  try {
    const response = await claudeService.chat({
      messages,
      asset: 'SOL-PERP',
      stream: false,
    });

    console.log('✅ Response received!\n');
    console.log('Content:', response.content);
    console.log('\n📊 Usage:');
    console.log(`   Input tokens: ${response.usage.input_tokens}`);
    console.log(`   Output tokens: ${response.usage.output_tokens}`);
    console.log(`   Model: ${response.model}`);

    const cost = claudeService.calculateCost(response.usage);
    console.log(`\n💰 Cost: $${cost.total_cost.toFixed(6)}`);

    return response;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function testStreamingChat() {
  console.log('\n\n🧪 Test 2: Streaming Chat\n');
  console.log('─'.repeat(50));

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: 'In one sentence, what is the most important rule for swing trading?',
    },
  ];

  try {
    console.log('📡 Streaming response:\n');

    let fullContent = '';
    const response = await claudeService.chat({
      messages,
      asset: 'BTC-PERP',
      stream: true,
      onStream: (chunk: string) => {
        process.stdout.write(chunk);
        fullContent += chunk;
      },
    });

    console.log('\n\n✅ Stream completed!\n');
    console.log('📊 Usage:');
    console.log(`   Input tokens: ${response.usage.input_tokens}`);
    console.log(`   Output tokens: ${response.usage.output_tokens}`);

    const cost = claudeService.calculateCost(response.usage);
    console.log(`\n💰 Cost: $${cost.total_cost.toFixed(6)}`);

    return response;
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

async function testMessageValidation() {
  console.log('\n\n🧪 Test 3: Message Validation\n');
  console.log('─'.repeat(50));

  // Test valid messages
  const validMessages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' },
    { role: 'user', content: 'How are you?' },
  ];

  const validResult = claudeService.validateMessages(validMessages);
  console.log('Valid messages:', validResult.valid ? '✅ PASS' : '❌ FAIL');

  // Test invalid messages (consecutive user messages)
  const invalidMessages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Hello' },
    { role: 'user', content: 'Are you there?' }, // Invalid!
  ];

  const invalidResult = claudeService.validateMessages(invalidMessages);
  console.log('Invalid messages:', !invalidResult.valid ? '✅ PASS' : '❌ FAIL');
  if (invalidResult.error) {
    console.log('   Error message:', invalidResult.error);
  }
}

async function testCostCalculation() {
  console.log('\n\n🧪 Test 4: Cost Calculation\n');
  console.log('─'.repeat(50));

  const usage = {
    input_tokens: 1500,
    output_tokens: 800,
  };

  const cost = claudeService.calculateCost(usage);

  console.log('Usage:', usage);
  console.log('Cost breakdown:');
  console.log(`   Input: $${cost.input_cost.toFixed(6)}`);
  console.log(`   Output: $${cost.output_cost.toFixed(6)}`);
  console.log(`   Total: $${cost.total_cost.toFixed(6)}`);
}

async function runAllTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('🚀 Claude Service Live API Test Suite');
  console.log('═══════════════════════════════════════════════');

  try {
    // Test 1: Non-streaming
    await testNonStreamingChat();

    // Test 2: Streaming
    await testStreamingChat();

    // Test 3: Validation (no API call)
    testMessageValidation();

    // Test 4: Cost calculation (no API call)
    testCostCalculation();

    console.log('\n═══════════════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.log('\n═══════════════════════════════════════════════');
    console.log('💥 TESTS FAILED!');
    console.log('═══════════════════════════════════════════════\n');

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    process.exit(1);
  }
}

// Run tests
runAllTests();
