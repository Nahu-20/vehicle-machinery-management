import { runFleetConsistencyTests } from './fleetConsistencyTests';

/**
 * Fleet suite runner, mirroring runChatTestsCli.ts.
 *
 *   npm run test:fleet
 */
function main() {
  console.log('Running Fleet Consistency Suite...');
  const results = runFleetConsistencyTests();

  let passedCount = 0;
  let failedCount = 0;

  console.log('\n======================================================================');
  console.log(' FLEET CONSISTENCY TEST RESULTS');
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
