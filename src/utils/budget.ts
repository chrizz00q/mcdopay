import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDate,
  parseISO,
} from 'date-fns';
import type {
  BudgetExpense,
  BudgetGroup,
  BudgetItem,
  BudgetPlan,
  Deductions,
  RuleKey,
} from '../types';

/* ---------- ids ---------- */

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ---------- groups & rules ---------- */

export const GROUPS: {
  key: BudgetGroup;
  label: string;
  hint: string;
  color: string;
}[] = [
  { key: 'needs', label: 'Needs', hint: 'Things you must pay for', color: 'var(--status-normal)' },
  { key: 'wants', label: 'Wants', hint: 'Things that are nice to have', color: 'var(--status-holiday)' },
  { key: 'savings', label: 'Savings', hint: 'Money you set aside first', color: 'var(--status-restday)' },
];

export const GROUP_LABEL: Record<BudgetGroup, string> = {
  needs: 'Needs',
  wants: 'Wants',
  savings: 'Savings',
};

export const RULES: Record<
  Exclude<RuleKey, 'custom'>,
  { label: string; description: string; split: Record<BudgetGroup, number> }
> = {
  balanced: {
    label: '50 / 30 / 20',
    description: 'The classic split. Good when your needs are under control.',
    split: { needs: 50, wants: 30, savings: 20 },
  },
  'needs-heavy': {
    label: '70 / 20 / 10',
    description: 'For when fare, school, and home share take most of your pay.',
    split: { needs: 70, wants: 20, savings: 10 },
  },
  goal: {
    label: '40 / 20 / 40',
    description: 'Saving hard for something big, like a laptop or tuition.',
    split: { needs: 40, wants: 20, savings: 40 },
  },
};

export const STARTER_ITEMS: { name: string; group: BudgetGroup }[] = [
  { name: 'Fare / commute', group: 'needs' },
  { name: 'Meals', group: 'needs' },
  { name: 'Load & data', group: 'needs' },
  { name: 'Share at home', group: 'needs' },
  { name: 'School expenses', group: 'needs' },
  { name: 'Treats & milk tea', group: 'wants' },
  { name: 'Hangouts', group: 'wants' },
  { name: 'Games & subscriptions', group: 'wants' },
  { name: 'Emergency fund', group: 'savings' },
  { name: 'Goal fund', group: 'savings' },
];

/* ---------- cutoff ids ---------- */

export type CutoffWhich = 1 | 2;

export function makeCutoffId(monthDate: Date, which: CutoffWhich): string {
  return `${format(monthDate, 'yyyy-MM')}-${which}`;
}

export function parseCutoffId(id: string): { monthDate: Date; which: CutoffWhich } | null {
  const m = /^(\d{4})-(\d{2})-([12])$/.exec(id);
  if (!m) return null;
  const monthDate = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return { monthDate, which: m[3] === '1' ? 1 : 2 };
}

export function currentCutoffId(today = new Date()): string {
  const day = getDate(today);
  if (day < 4) return makeCutoffId(addMonths(today, -1), 2);
  return makeCutoffId(today, day < 19 ? 1 : 2);
}

export function shiftCutoff(id: string, delta: 1 | -1): string {
  const parsed = parseCutoffId(id);
  if (!parsed) return currentCutoffId();
  const { monthDate, which } = parsed;
  if (delta === 1) {
    return which === 1 ? makeCutoffId(monthDate, 2) : makeCutoffId(addMonths(monthDate, 1), 1);
  }
  return which === 2 ? makeCutoffId(monthDate, 1) : makeCutoffId(addMonths(monthDate, -1), 2);
}

export function cutoffRangeLabel(id: string): string {
  const parsed = parseCutoffId(id);
  if (!parsed) return id;
  const { monthDate, which } = parsed;
  const last = getDate(endOfMonth(monthDate));
  const range = which === 1 ? '1–15' : `16–${last}`;
  return `${which === 1 ? '1st' : '2nd'} cutoff · ${format(monthDate, 'MMM')} ${range}, ${format(monthDate, 'yyyy')}`;
}

export function defaultPaydays(cutoffId: string): { payday: string; nextPayday: string } {
  const parsed = parseCutoffId(cutoffId);
  const monthDate = parsed?.monthDate ?? new Date();
  const firstCutoff = parsed?.which !== 2;
  const paydayMonth = firstCutoff ? monthDate : addMonths(monthDate, 1);
  const nextPaydayMonth = firstCutoff ? addMonths(monthDate, 1) : paydayMonth;
  const payday = new Date(paydayMonth.getFullYear(), paydayMonth.getMonth(), firstCutoff ? 19 : 4);
  const nextPayday = new Date(
    nextPaydayMonth.getFullYear(),
    nextPaydayMonth.getMonth(),
    firstCutoff ? 4 : 19,
  );

  return { payday: format(payday, 'yyyy-MM-dd'), nextPayday: format(nextPayday, 'yyyy-MM-dd') };
}

/* ---------- defaults ---------- */

export function defaultPlan(cutoffId: string): BudgetPlan {
  const paydays = defaultPaydays(cutoffId);
  return {
    cutoffId,
    incomeSource: 'logged',
    manualGross: 0,
    deductions: { sss: 0, philhealth: 0, pagibig: 0, other: 0 },
    rule: 'balanced',
    split: { ...RULES.balanced.split },
    items: [],
    expenses: [],
    payday: paydays.payday,
    nextPayday: paydays.nextPayday,
  };
}

/* ---------- pay & deductions ---------- */

export function totalDeductions(d: Deductions): number {
  return round2(d.sss + d.philhealth + d.pagibig + d.other);
}

/**
 * Rough employee-share estimates for a MONTH of pay (2026 schedules):
 * SSS 5% of the salary credit (credit rounds to the nearest 500, between 5,000 and 35,000),
 * PhilHealth 2.5% of pay (base between 10,000 and 100,000),
 * Pag-IBIG 2% of pay up to 10,000 (1% when monthly pay is 1,500 or less).
 * Tax is not estimated.
 */
export function estimateMonthlyContributions(monthlyGross: number): Omit<Deductions, 'other'> {
  if (monthlyGross <= 0) return { sss: 0, philhealth: 0, pagibig: 0 };
  const msc = Math.min(35000, Math.max(5000, Math.round(monthlyGross / 500) * 500));
  const philBase = Math.min(100000, Math.max(10000, monthlyGross));
  const pagibigRate = monthlyGross <= 1500 ? 0.01 : 0.02;
  return {
    sss: round2(msc * 0.05),
    philhealth: round2(philBase * 0.025),
    pagibig: round2(Math.min(monthlyGross, 10000) * pagibigRate),
  };
}

/** Splits the monthly estimate across the two cutoffs of a month. */
export function estimateCutoffContributions(cutoffGross: number): Omit<Deductions, 'other'> {
  const monthly = estimateMonthlyContributions(cutoffGross * 2);
  return {
    sss: round2(monthly.sss / 2),
    philhealth: round2(monthly.philhealth / 2),
    pagibig: round2(monthly.pagibig / 2),
  };
}

/* ---------- stats ---------- */

export interface BudgetStats {
  gross: number;
  deductions: number;
  net: number;
  targets: Record<BudgetGroup, number>;
  planned: Record<BudgetGroup, number>;
  totalPlanned: number;
  unassigned: number;
  spentByItem: Record<string, number>;
  spentByGroup: Record<BudgetGroup, number>;
  totalSpent: number;
  /** Planned needs + wants that has not been spent yet. */
  spendableLeft: number;
}

export function computeBudgetStats(plan: BudgetPlan, loggedGross: number): BudgetStats {
  const gross = plan.incomeSource === 'logged' ? loggedGross : plan.manualGross;
  const deductions = totalDeductions(plan.deductions);
  const net = Math.max(0, round2(gross - deductions));

  const needsTarget = round2((net * plan.split.needs) / 100);
  const wantsTarget = round2((net * plan.split.wants) / 100);
  const targets: Record<BudgetGroup, number> = {
    needs: needsTarget,
    wants: wantsTarget,
    savings: round2(net - needsTarget - wantsTarget),
  };

  const planned: Record<BudgetGroup, number> = { needs: 0, wants: 0, savings: 0 };
  const spentByItem: Record<string, number> = {};
  const spentByGroup: Record<BudgetGroup, number> = { needs: 0, wants: 0, savings: 0 };
  const groupOf = new Map<string, BudgetGroup>();

  plan.items.forEach((item) => {
    planned[item.group] += item.planned;
    groupOf.set(item.id, item.group);
    spentByItem[item.id] = 0;
  });

  plan.expenses.forEach((e) => {
    const g = groupOf.get(e.itemId);
    if (!g) return;
    spentByItem[e.itemId] += e.amount;
  });

  // A savings item counts as "spent" once the money has been moved.
  plan.items.forEach((item) => {
    if (item.group === 'savings' && item.done) spentByItem[item.id] = item.planned;
    spentByGroup[item.group] += spentByItem[item.id];
  });

  (Object.keys(planned) as BudgetGroup[]).forEach((k) => {
    planned[k] = round2(planned[k]);
    spentByGroup[k] = round2(spentByGroup[k]);
  });

  const totalPlanned = round2(planned.needs + planned.wants + planned.savings);
  const spendableLeft = round2(
    planned.needs + planned.wants - spentByGroup.needs - spentByGroup.wants,
  );

  return {
    gross,
    deductions,
    net,
    targets,
    planned,
    totalPlanned,
    unassigned: round2(net - totalPlanned),
    spentByItem,
    spentByGroup,
    totalSpent: round2(spentByGroup.needs + spentByGroup.wants),
    spendableLeft,
  };
}

export function itemSpent(item: BudgetItem, expenses: BudgetExpense[]): number {
  if (item.group === 'savings' && item.done) return item.planned;
  return round2(expenses.filter((e) => e.itemId === item.id).reduce((s, e) => s + e.amount, 0));
}

/* ---------- daily allowance ---------- */

export interface DailyAllowance {
  days: number;
  assumed: boolean; // true when the next payday was not set and 15 days were assumed
  perDay: number;
}

export function computeDailyAllowance(
  plan: BudgetPlan,
  stats: BudgetStats,
  today = new Date(),
): DailyAllowance {
  const start = plan.payday ? parseISO(plan.payday) : today;
  const from = start > today ? start : today;
  const end = plan.nextPayday ? parseISO(plan.nextPayday) : addDays(start, 15);
  const days = Math.max(1, differenceInCalendarDays(end, from));
  return {
    days,
    assumed: !plan.nextPayday,
    perDay: Math.max(0, round2(stats.spendableLeft / days)),
  };
}

/* ---------- coach ---------- */

export type CoachState = 'done' | 'todo' | 'warn';
export type CoachAction = 'estimate-deductions' | 'assign-rest' | null;

export interface CoachStep {
  key: string;
  title: string;
  detail: string;
  state: CoachState;
  action: CoachAction;
}

export function buildCoach(
  plan: BudgetPlan,
  stats: BudgetStats,
  money: (n: number) => string,
): CoachStep[] {
  const steps: CoachStep[] = [];
  const hasSavingsItem = plan.items.some((i) => i.group === 'savings' && i.planned > 0);
  const savingsDone =
    hasSavingsItem && plan.items.filter((i) => i.group === 'savings' && i.planned > 0).every((i) => i.done);

  // 1. Take-home
  if (stats.net <= 0) {
    steps.push({
      key: 'pay',
      title: 'Find your take-home pay',
      detail:
        plan.incomeSource === 'logged'
          ? 'No pay logged for this cutoff yet. Log hours on the Dashboard, or switch to typing your own estimate.'
          : 'Type what you expect to receive. Base it on hours you are sure about.',
      state: 'todo',
      action: null,
    });
  } else if (stats.deductions === 0) {
    steps.push({
      key: 'pay',
      title: 'Check your deductions',
      detail: `Gross is ${money(stats.gross)}. If your payslip shows SSS, PhilHealth or Pag-IBIG, enter them so you do not budget money you will not receive.`,
      state: 'warn',
      action: 'estimate-deductions',
    });
  } else {
    steps.push({
      key: 'pay',
      title: 'Take-home pay is set',
      detail: `You are budgeting ${money(stats.net)} after ${money(stats.deductions)} in deductions.`,
      state: 'done',
      action: null,
    });
  }

  // 2. Savings first
  if (stats.net > 0) {
    if (savingsDone) {
      steps.push({
        key: 'savings',
        title: 'Savings are set aside',
        detail: `${money(stats.planned.savings)} has been moved. Spend only what is left.`,
        state: 'done',
        action: null,
      });
    } else if (stats.planned.savings < stats.targets.savings) {
      steps.push({
        key: 'savings',
        title: 'Pay yourself first',
        detail: `Your split suggests ${money(stats.targets.savings)} for savings; you have planned ${money(stats.planned.savings)}. Even a small amount builds the habit. Move it on payday, then tick it off.`,
        state: stats.planned.savings === 0 ? 'todo' : 'warn',
        action: null,
      });
    } else {
      steps.push({
        key: 'savings',
        title: 'Move your savings on payday',
        detail: `You planned ${money(stats.planned.savings)}. Transfer it to a separate place, then tick each savings item as moved.`,
        state: 'todo',
        action: null,
      });
    }
  }

  // 3. Needs
  if (stats.net > 0) {
    const over = round2(stats.planned.needs - stats.targets.needs);
    if (stats.planned.needs === 0) {
      steps.push({
        key: 'needs',
        title: 'List your needs',
        detail: 'Add fare, meals, load, school costs and any share you give at home.',
        state: 'todo',
        action: null,
      });
    } else if (over > 0) {
      steps.push({
        key: 'needs',
        title: 'Needs are over your guide',
        detail: `Needs are ${money(over)} above the ${money(stats.targets.needs)} guide. Trim a cost, or switch to a split with more room for needs.`,
        state: 'warn',
        action: null,
      });
    } else {
      steps.push({
        key: 'needs',
        title: 'Needs are covered',
        detail: `${money(stats.planned.needs)} planned, within the ${money(stats.targets.needs)} guide.`,
        state: 'done',
        action: null,
      });
    }
  }

  // 4. Wants
  if (stats.net > 0) {
    const over = round2(stats.planned.wants - stats.targets.wants);
    if (over > 0) {
      steps.push({
        key: 'wants',
        title: 'Cap your wants',
        detail: `Wants are ${money(over)} above the ${money(stats.targets.wants)} guide. Cut one item or move that amount to savings.`,
        state: 'warn',
        action: null,
      });
    } else {
      steps.push({
        key: 'wants',
        title: 'Wants have a limit',
        detail:
          stats.planned.wants === 0
            ? `You can give yourself up to ${money(stats.targets.wants)} for fun. A budget with no treats is hard to keep.`
            : `${money(stats.planned.wants)} planned, within the ${money(stats.targets.wants)} guide.`,
        state: stats.planned.wants === 0 ? 'todo' : 'done',
        action: null,
      });
    }
  }

  // 5. Every peso
  if (stats.net > 0) {
    if (stats.unassigned < 0) {
      steps.push({
        key: 'assign',
        title: 'You planned more than you earn',
        detail: `You are ${money(Math.abs(stats.unassigned))} over your take-home. Lower an amount until this reaches zero.`,
        state: 'warn',
        action: null,
      });
    } else if (stats.unassigned > 0) {
      steps.push({
        key: 'assign',
        title: 'Give every peso a job',
        detail: `${money(stats.unassigned)} has no job yet. Unassigned money tends to disappear.`,
        state: 'todo',
        action: 'assign-rest',
      });
    } else if (stats.totalPlanned > 0) {
      steps.push({
        key: 'assign',
        title: 'Every peso has a job',
        detail: 'Your plan matches your take-home exactly.',
        state: 'done',
        action: null,
      });
    }
  }

  // 6. Payday dates
  steps.push({
    key: 'dates',
    title: plan.nextPayday ? 'Payday dates are set' : 'Set your next payday',
    detail: plan.nextPayday
      ? 'Your daily limit counts down to that date.'
      : 'Add it below so the daily limit knows how long this money has to last.',
    state: plan.nextPayday ? 'done' : 'todo',
    action: null,
  });

  // 7. Track
  steps.push({
    key: 'track',
    title: plan.expenses.length > 0 ? 'You are tracking spending' : 'Log what you spend',
    detail:
      plan.expenses.length > 0
        ? `${plan.expenses.length} expense${plan.expenses.length === 1 ? '' : 's'} logged so far.`
        : 'Add each purchase to its envelope. It takes five seconds and shows when you are close to a limit.',
    state: plan.expenses.length > 0 ? 'done' : 'todo',
    action: null,
  });

  return steps;
}

/* ---------- plain-text summary ---------- */

export function buildBudgetSummary(
  plan: BudgetPlan,
  stats: BudgetStats,
  appName: string,
  money: (n: number) => string,
): string {
  const rows: string[] = [];
  rows.push(`${appName} budget — ${cutoffRangeLabel(plan.cutoffId)}`);
  rows.push('-'.repeat(48));
  rows.push(`Gross pay: ${money(stats.gross)}`);
  rows.push(`Deductions: ${money(stats.deductions)}`);
  rows.push(`Take-home: ${money(stats.net)}`);
  GROUPS.forEach((g) => {
    const items = plan.items.filter((i) => i.group === g.key && i.planned > 0);
    rows.push('');
    rows.push(`${g.label} (${plan.split[g.key]}%) — ${money(stats.planned[g.key])}`);
    items.forEach((i) => rows.push(`  ${i.name}: ${money(i.planned)}`));
  });
  rows.push('-'.repeat(48));
  rows.push(`Unassigned: ${money(stats.unassigned)}`);
  return rows.join('\n');
}
