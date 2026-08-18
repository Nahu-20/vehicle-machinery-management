import { runAllInvestmentSecurityTests, setCustomMutateHandler } from './investmentSecurityTests';
import { enableInvestmentApiTestMode, handleInvestmentMutation } from '../server/investmentApi';

process.env.INVESTMENT_ALLOW_TEST_AUTH = 'true';
enableInvestmentApiTestMode(true);

setCustomMutateHandler(async (action, actorUid, payload, expectedVersion) => {
  let statusCode = 200;
  let responseData: any = null;

  const mockReq: any = {
    body: { action, actorUid, payload, expectedVersion },
    headers: {},
  };

  const mockRes: any = {
    status(code: number) {
      statusCode = code;
      return mockRes;
    },
    json(data: any) {
      responseData = data;
      return mockRes;
    },
    send(data: any) {
      responseData = data;
      return mockRes;
    },
  };

  await handleInvestmentMutation(mockReq, mockRes);
  return { status: statusCode, data: responseData };
});

async function main() {
  console.log('Running A2B-G Acceptance & Security Audit Suite...');
  const results = await runAllInvestmentSecurityTests();
  let passedCount = 0;
  let failedCount = 0;

  console.log('\n======================================================================');
  console.log(' A2B-G FINAL ACCEPTANCE TEST RESULTS SUMMARY');
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
