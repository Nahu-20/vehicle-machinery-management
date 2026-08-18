import { runAllProductStatisticsAdapterTests } from './productStatisticsAdapterTests';

async function main() {
  console.log('Running Milestone P2 — Published Investment Dataset -> Product Statistics Adapter Tests...\n');
  const results = await runAllProductStatisticsAdapterTests();
  let passedCount = 0;
  let failedCount = 0;

  console.log('======================================================================');
  console.log(' MILESTONE P2 ADAPTER TEST RESULTS');
  console.log('======================================================================\n');

  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`[PASS] #${r.id} ${r.name}`);
      console.log(`       ${r.message}`);
    } else {
      failedCount++;
      console.log(`[FAIL] #${r.id} ${r.name}`);
      console.log(`       ${r.message}`);
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('----------------------------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
