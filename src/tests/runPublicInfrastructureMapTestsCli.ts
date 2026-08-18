import { runPublicInfrastructureMapTests } from './publicInfrastructureMapTests';

async function main() {
  console.log('Running Milestone P4A-3 — Public Investment Map Infrastructure Layer Test Suite...\n');
  const results = await runPublicInfrastructureMapTests();
  let passedCount = 0;
  let failedCount = 0;

  console.log('======================================================================');
  console.log(' MILESTONE P4A-3 PUBLIC INFRASTRUCTURE MAP ACCEPTANCE RESULTS');
  console.log('======================================================================\n');

  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`[PASS] ${r.id} ${r.name} (${r.durationMs}ms)`);
      console.log(`       ${r.message}`);
    } else {
      failedCount++;
      console.log(`[FAIL] ${r.id} ${r.name} (${r.durationMs}ms)`);
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
