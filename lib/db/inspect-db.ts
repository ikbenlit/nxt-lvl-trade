/**
 * Database Inspection Script
 *
 * Quick script to check message persistence status.
 */

import { db } from './client';
import { conversationThreads, conversationMessages } from './schema';
import { desc, sql } from 'drizzle-orm';

async function inspectDatabase() {
  console.log('📊 Database Inspection - Message Persistence\n');

  // Count threads
  const threadCount = await db.select({ count: sql<number>`count(*)` })
    .from(conversationThreads);
  console.log(`✅ Conversation Threads: ${threadCount[0].count}`);

  // Count messages
  const messageCount = await db.select({ count: sql<number>`count(*)` })
    .from(conversationMessages);
  console.log(`✅ Messages: ${messageCount[0].count}\n`);

  // Show recent threads
  const threads = await db
    .select({
      id: conversationThreads.id,
      topic: conversationThreads.topic,
      asset: conversationThreads.asset,
      createdAt: conversationThreads.createdAt,
    })
    .from(conversationThreads)
    .orderBy(desc(conversationThreads.createdAt))
    .limit(5);

  if (threads.length > 0) {
    console.log('📝 Recent Threads:');
    threads.forEach((t) => {
      const date = t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A';
      console.log(`   [${t.id}] ${t.topic?.slice(0, 40) || 'No topic'} (${t.asset || 'No asset'}) - ${date}`);
    });
  } else {
    console.log('📝 No threads yet (chat not used)');
  }

  // Show messages for latest thread
  if (threads.length > 0) {
    const latestThreadId = threads[0].id;
    const messages = await db
      .select({
        id: conversationMessages.id,
        role: conversationMessages.role,
        content: conversationMessages.content,
        tokensUsed: conversationMessages.tokensUsed,
        toolsUsed: conversationMessages.toolsUsed,
        timestamp: conversationMessages.timestamp,
      })
      .from(conversationMessages)
      .where(sql`${conversationMessages.threadId} = ${latestThreadId}`)
      .orderBy(conversationMessages.timestamp);

    console.log(`\n💬 Messages in Thread ${latestThreadId}:`);
    messages.forEach((m) => {
      const preview = m.content.slice(0, 60).replace(/\n/g, ' ');
      const tools = m.toolsUsed ? ` [Tools: ${m.toolsUsed.map((t: any) => t.name).join(', ')}]` : '';
      console.log(`   [${m.role}] ${preview}...${tools}`);
    });

    // Check tool persistence
    const messagesWithTools = messages.filter((m) => m.toolsUsed && m.toolsUsed.length > 0);
    if (messagesWithTools.length > 0) {
      console.log(`\n🔧 Tool Execution Persistence: ✅ ${messagesWithTools.length} messages with tools`);
      messagesWithTools.forEach((m) => {
        console.log(`   Tools used: ${m.toolsUsed?.map((t: any) => t.name).join(', ')}`);
      });
    } else {
      console.log('\n🔧 Tool Execution Persistence: ⏸️ No tools used yet');
    }

    // Check token tracking
    const messagesWithTokens = messages.filter((m) => m.tokensUsed && m.tokensUsed > 0);
    if (messagesWithTokens.length > 0) {
      const totalTokens = messagesWithTokens.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
      console.log(`\n💰 Token Tracking: ✅ ${messagesWithTokens.length} messages tracked (${totalTokens} tokens total)`);
    } else {
      console.log('\n💰 Token Tracking: ⏸️ No token usage tracked yet');
    }
  }

  console.log('\n✅ Inspection complete\n');
}

inspectDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
