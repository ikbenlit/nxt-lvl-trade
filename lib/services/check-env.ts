/**
 * Check environment variables
 * Run with: pnpm tsx lib/services/check-env.ts
 */

import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

console.log('\n🔍 Checking environment variables...\n');

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.log('❌ ANTHROPIC_API_KEY is not set in .env.local');
  console.log('\nPlease add it to .env.local:');
  console.log('ANTHROPIC_API_KEY=sk-ant-api03-...');
  process.exit(1);
}

console.log('✅ ANTHROPIC_API_KEY is set');
console.log(`   Length: ${apiKey.length} characters`);
console.log(`   Starts with: ${apiKey.substring(0, 15)}...`);
console.log(`   Ends with: ...${apiKey.substring(apiKey.length - 10)}`);

// Check for common issues
const issues: string[] = [];

if (!apiKey.startsWith('sk-ant-')) {
  issues.push('⚠️  Key should start with "sk-ant-"');
}

if (apiKey.includes(' ')) {
  issues.push('⚠️  Key contains spaces (remove them)');
}

if (apiKey.includes('\n') || apiKey.includes('\r')) {
  issues.push('⚠️  Key contains newlines (remove them)');
}

if (apiKey.length < 50) {
  issues.push('⚠️  Key seems too short (should be ~100+ characters)');
}

if (issues.length > 0) {
  console.log('\n⚠️  Potential issues found:');
  issues.forEach(issue => console.log(`   ${issue}`));
} else {
  console.log('\n✅ No obvious issues found');
  console.log('   If API calls still fail, the key might be expired or invalid.');
  console.log('   Generate a new one at: https://console.anthropic.com/');
}

console.log();
