import { runAllPublicThematicMapTests } from './publicThematicMapTests';

async function main() {
  console.log('Running Milestone P3-F — Public Thematic Map Acceptance & Security Audit Suite...\n');
  const results = await runAllPublicThematicMapTests();
  let passedCount = 0;
  let failedCount = 0;

  console.log('======================================================================');
  console.log(' MILESTONE P3-F THEMATIC MAP AUDIT RESULTS');
  console.log('======================================================================\n');

  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`[PASS] #${r.id} [${r.category}] ${r.name}`);
      console.log(`       ${r.message}`);
    } else {
      failedCount++;
      console.log(`[FAIL] #${r.id} [${r.category}] ${r.name}`);
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
