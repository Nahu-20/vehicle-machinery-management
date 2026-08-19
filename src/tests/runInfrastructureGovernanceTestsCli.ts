import { runAllInfrastructureGovernanceTests } from './infrastructureGovernanceTests';
import { enableInvestmentApiTestMode } from '../server/investmentApi';

process.env.INVESTMENT_ALLOW_TEST_AUTH = 'true';
enableInvestmentApiTestMode(true);

async function main() {
  console.log('Running Milestone P4A-1 & P4A-2A — Infrastructure Governance & Admin CMS Final Acceptance Suite...\n');
  const results = await runAllInfrastructureGovernanceTests();
  let passedCount = 0;
  let failedCount = 0;

  console.log('======================================================================');
  console.log(' MILESTONE P4A-1 & P4A-2A FINAL AUDIT RESULTS');
  console.log('======================================================================\n');

  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`[PASS] #${r.id} [${r.suite}] ${r.name}`);
      console.log(`       ${r.message}`);
    } else {
      failedCount++;
      console.log(`[FAIL] #${r.id} [${r.suite}] ${r.name}`);
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
