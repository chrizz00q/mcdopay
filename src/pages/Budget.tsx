import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CoachCard } from '../components/budget/CoachCard';
import { CutoffPicker } from '../components/budget/CutoffPicker';
import { DailyLimit } from '../components/budget/DailyLimit';
import { Envelopes } from '../components/budget/Envelopes';
import { PayCard } from '../components/budget/PayCard';
import { SpendingLog } from '../components/budget/SpendingLog';
import { SplitCard } from '../components/budget/SplitCard';
import { Header } from '../components/Header';
import { Toast } from '../components/Toast';
import { useAppData } from '../context/AppDataContext';
import type { BudgetExpense, BudgetItem, BudgetPlan } from '../types';
import {
  STARTER_ITEMS,
  buildBudgetSummary,
  buildCoach,
  computeBudgetStats,
  computeDailyAllowance,
  currentCutoffId,
  defaultPaydays,
  defaultPlan,
  estimateCutoffContributions,
  parseCutoffId,
  round2,
  shiftCutoff,
  uid,
  type CoachAction,
} from '../utils/budget';
import { computeMonthSummary, formatCurrency } from '../utils/calculations';

export function Budget() {
  const { entries, settings, budgets, savePlan } = useAppData();
  const [params, setParams] = useSearchParams();
  const [toast, setToast] = useState<string | null>(null);

  const requested = params.get('c');
  const cutoffId = requested && parseCutoffId(requested) ? requested : currentCutoffId();

  const savedPlan = budgets[cutoffId];
  const plan: BudgetPlan = useMemo(() => {
    if (!savedPlan) return defaultPlan(cutoffId);
    const paydays = defaultPaydays(cutoffId);
    return {
      ...savedPlan,
      payday: savedPlan.payday ?? paydays.payday,
      nextPayday: savedPlan.nextPayday ?? paydays.nextPayday,
    };
  }, [savedPlan, cutoffId]);
  const previousId = shiftCutoff(cutoffId, -1);
  const previousPlan = budgets[previousId];

  // Pay logged on the Dashboard for this cutoff.
  const loggedGross = useMemo(() => {
    const parsed = parseCutoffId(cutoffId);
    if (!parsed) return 0;
    const summary = computeMonthSummary(entries, parsed.monthDate, settings.hourlyRate);
    return (parsed.which === 1 ? summary.firstCutoff : summary.secondCutoff).totalPay;
  }, [entries, cutoffId, settings.hourlyRate]);

  const stats = useMemo(() => computeBudgetStats(plan, loggedGross), [plan, loggedGross]);
  const allowance = computeDailyAllowance(plan, stats);
  const steps = buildCoach(plan, stats, formatCurrency);

  const change = (patch: Partial<BudgetPlan>) => savePlan({ ...plan, ...patch });
  const setItems = (items: BudgetItem[]) => change({ items });

  const addStarter = () =>
    setItems([
      ...plan.items,
      ...STARTER_ITEMS.map((s) => ({ id: uid(), name: s.name, group: s.group, planned: 0 })),
    ]);

  const copyPrevious = () => {
    if (!previousPlan) return;
    change({
      items: previousPlan.items.map((i) => ({ ...i, id: uid(), done: false })),
      rule: previousPlan.rule,
      split: { ...previousPlan.split },
    });
    setToast('Copied envelopes from the last cutoff.');
  };

  const addExpense = (expense: BudgetExpense) => {
    change({ expenses: [...plan.expenses, expense] });
    setToast('Spending logged.');
  };

  const removeExpense = (id: string) => change({ expenses: plan.expenses.filter((e) => e.id !== id) });

  const runAction = (action: Exclude<CoachAction, null>) => {
    if (action === 'estimate-deductions') {
      const useLoggedGross = loggedGross > 0;
      const gross = useLoggedGross ? loggedGross : stats.gross;
      change({
        ...(useLoggedGross ? { incomeSource: 'logged' as const } : {}),
        deductions: { ...plan.deductions, ...estimateCutoffContributions(gross) },
      });
      setToast(
        useLoggedGross
          ? 'Dashboard pay synced and deductions estimated. Compare them with your payslip.'
          : 'Estimated deductions added. Compare them with your payslip.',
      );
      return;
    }
    // assign-rest: put the leftover into the first savings envelope (or create one)
    if (stats.unassigned <= 0) return;
    const target = plan.items.find((i) => i.group === 'savings');
    if (target) {
      setItems(
        plan.items.map((i) =>
          i.id === target.id ? { ...i, planned: round2(i.planned + stats.unassigned), done: false } : i,
        ),
      );
    } else {
      setItems([
        ...plan.items,
        { id: uid(), name: 'Emergency fund', group: 'savings', planned: stats.unassigned },
      ]);
    }
    setToast('The rest went to savings.');
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildBudgetSummary(plan, stats, settings.appName, formatCurrency));
      setToast('Budget plan copied to clipboard.');
    } catch {
      setToast('Could not access clipboard. Try copying manually.');
    }
  };

  return (
    <div className="app-shell">
      <Header subtitle="Budget planner" />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <CutoffPicker cutoffId={cutoffId} onChange={(id) => setParams({ c: id }, { replace: true })} />
          <PayCard
            plan={plan}
            stats={stats}
            loggedGross={loggedGross}
            onChange={change}
            onEstimate={() => runAction('estimate-deductions')}
          />
          <SplitCard plan={plan} stats={stats} onChange={change} onCopy={copySummary} />
          <Envelopes
            plan={plan}
            stats={stats}
            hasPreviousPlan={Boolean(previousPlan && previousPlan.items.length > 0)}
            onItemsChange={setItems}
            onStarter={addStarter}
            onCopyPrevious={copyPrevious}
          />
          <SpendingLog plan={plan} onAdd={addExpense} onRemove={removeExpense} />
        </div>

        <div className="dashboard-side budget-side">
          <CoachCard steps={steps} onAction={runAction} />
          <DailyLimit plan={plan} stats={stats} allowance={allowance} onChange={change} />
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
