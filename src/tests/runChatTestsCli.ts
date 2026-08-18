import { runChatSystemTests } from './chatSystemTests';

/**
 * Chat suite runner, mirroring runSecurityTestsCli.ts.
 *
 * Kept separate from that runner because it is scoped to the investment
 * security audit; chat retrieval is a different concern.
 *
 *   npm run test:chat
 */
function main() {
  console.log('Running Chatbot Retrieval & Language Suite...');
  const results = runChatSystemTests();

  let passedCount = 0;
  let failedCount = 0;

  console.log('\n======================================================================');
  console.log(' CHATBOT SYSTEM TEST RESULTS');
  console.log('======================================================================\n');

  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`[PASS] #${r.id} (${r.category}) ${r.name}`);
    } else {
      failedCount++;
      console.log(`[FAIL] #${r.id} (${r.category}) ${r.name}`);
      console.log(`       ${r.message}`);
      if (r.details) console.log(`       details: ${JSON.stringify(r.details)}`);
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('----------------------------------------------------------------------\n');

  process.exit(failedCount > 0 ? 1 : 0);
}

main();
