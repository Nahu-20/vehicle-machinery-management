import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { runAllInvestmentSecurityTests, TestResult } from '../../../tests/investmentSecurityTests';

export function AdminInvestmentTestsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await runAllInvestmentSecurityTests();
      setResults(res);
    } catch (err) {
      console.error('Error running security tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#11221A] p-6 rounded-xl border border-slate-200 dark:border-emerald-800/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Milestone A1 Security & Architecture Validation Tests
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Automated verification of RBAC rules, canonical key isolation, score limits, source publication requirements, and DTO transformations.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Validation Suite
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-[#11221A] rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 uppercase">Total Test Cases</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{total}</p>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 uppercase">Passed</span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{passedCount}</p>
        </div>

        <div className={`p-4 rounded-xl border ${failedCount === 0 ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40'}`}>
          <span className={`text-xs font-medium uppercase ${failedCount === 0 ? 'text-slate-500' : 'text-rose-800 dark:text-rose-300'}`}>Failed</span>
          <p className={`text-2xl font-bold mt-1 ${failedCount === 0 ? 'text-slate-900 dark:text-white' : 'text-rose-700 dark:text-rose-400'}`}>{failedCount}</p>
        </div>
      </div>

      {/* Test Results Table */}
      <div className="bg-white dark:bg-[#11221A] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Security & Governance Assertion Logs</h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {results.map((res) => (
            <div key={res.id} className="p-4 flex items-start gap-3">
              {res.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-slate-900 dark:text-white">
                    #{res.id}. {res.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${res.passed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                    {res.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  {res.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminInvestmentTestsPage;
