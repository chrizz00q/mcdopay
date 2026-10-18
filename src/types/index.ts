export type RateType = 'normal' | 'night';

export type PayModifier = 'none' | 'holiday' | 'double';

export type QuickLabel = 'restday' | 'excused' | null;

export interface DayEntry {
  date: string; // yyyy-MM-dd
  normalHours: number;
  overtimeHours: number;
  rateType: RateType;
  modifier: PayModifier;
  notes: string;
  quickLabel: QuickLabel;
}

export type EntryMap = Record<string, DayEntry>;

export type ThemeMode = 'dark' | 'light';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm
}

export interface AppSettings {
  appName: string;
  hourlyRate: number;
  theme: ThemeMode;
  reminder: ReminderSettings;
  restDays: Weekday[];
}

export interface DayComputation {
  hours: number;
  pay: number;
  rateMultiplier: number;
  state: DayState;
}

export type DayState =
  | 'empty'
  | 'normal'
  | 'night'
  | 'holiday'
  | 'double'
  | 'restday'
  | 'excused';

export interface CutoffSummary {
  label: string;
  startDay: number;
  endDay: number;
  totalHours: number;
  totalPay: number;
  daysWorked: number;
}

export interface MonthSummary {
  totalHours: number;
  totalPay: number;
  daysWorked: number;
  firstCutoff: CutoffSummary;
  secondCutoff: CutoffSummary;
}

/* ---------- Budget ---------- */

export type BudgetGroup = 'needs' | 'wants' | 'savings';

export type RuleKey = 'balanced' | 'needs-heavy' | 'goal' | 'custom';

export type IncomeSource = 'logged' | 'manual';

export interface BudgetItem {
  id: string;
  name: string;
  group: BudgetGroup;
  planned: number;
  /** Savings only: money has actually been moved out of the spending account. */
  done?: boolean;
}

export interface BudgetExpense {
  id: string;
  date: string; // yyyy-MM-dd
  itemId: string;
  amount: number;
  note: string;
}

export interface Deductions {
  sss: number;
  philhealth: number;
  pagibig: number;
  other: number;
}

export interface BudgetPlan {
  cutoffId: string; // yyyy-MM-1 or yyyy-MM-2
  incomeSource: IncomeSource;
  manualGross: number;
  deductions: Deductions;
  rule: RuleKey;
  split: Record<BudgetGroup, number>; // percentages, sum to 100
  items: BudgetItem[];
  expenses: BudgetExpense[];
  payday: string | null; // date this salary is received
  nextPayday: string | null; // date the next salary arrives
}

export type BudgetMap = Record<string, BudgetPlan>;
