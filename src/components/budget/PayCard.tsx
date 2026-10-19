import { Calculator, HandCoins, Minus, Wallet } from 'lucide-react';
import type { BudgetPlan, Deductions } from '../../types';
import type { BudgetStats } from '../../utils/budget';
import { formatCurrency } from '../../utils/calculations';
import { MoneyInput } from '../MoneyInput';
import { SummaryCard } from '../SummaryCard';

interface PayCardProps {
  plan: BudgetPlan;
  stats: BudgetStats;
  loggedGross: number;
  onChange: (patch: Partial<BudgetPlan>) => void;
  onEstimate: () => void;
}

const DEDUCTION_FIELDS: { key: keyof Deductions; label: string }[] = [
  { key: 'sss', label: 'SSS' },
  { key: 'philhealth', label: 'PhilHealth' },
  { key: 'pagibig', label: 'Pag-IBIG' },
  { key: 'other', label: 'Other (tax, loans)' },
];

export function PayCard({ plan, stats, loggedGross, onChange, onEstimate }: PayCardProps) {
  const setDeduction = (key: keyof Deductions, value: number) =>
    onChange({ deductions: { ...plan.deductions, [key]: value } });

  return (
    <section className="budget-pay" aria-label="Your pay for this cutoff">
      <div className="summary-grid summary-grid--budget">
        <SummaryCard icon={Wallet} label="Gross pay" value={formatCurrency(stats.gross)} />
        <SummaryCard icon={Minus} label="Deductions" value={formatCurrency(stats.deductions)} />
        <SummaryCard icon={HandCoins} label="Take-home" value={formatCurrency(stats.net)} accent="accent" />
      </div>

      <div className="card pay-card">
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Where does your pay come from?</div>
            <div className="settings-row__sublabel">
              {plan.incomeSource === 'logged'
                ? `${formatCurrency(loggedGross)} from hours logged on the Dashboard`
                : 'Use your own number, for example before the cutoff ends'}
            </div>
          </div>
          <div className="segmented pay-card__source">
            <button
              type="button"
              className="segmented__option"
              data-active={plan.incomeSource === 'logged'}
              onClick={() => onChange({ incomeSource: 'logged' })}
            >
              Logged hours
            </button>
            <button
              type="button"
              className="segmented__option"
              data-active={plan.incomeSource === 'manual'}
              onClick={() => onChange({ incomeSource: 'manual' })}
            >
              I'll type it
            </button>
          </div>
        </div>

        {plan.incomeSource === 'manual' && (
          <div className="field">
            <label htmlFor="manual-gross">Expected gross pay</label>
            <MoneyInput
              id="manual-gross"
              value={plan.manualGross}
              onChange={(v) => onChange({ manualGross: v })}
            />
          </div>
        )}

        <div>
          <div className="settings-row" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <div className="settings-row__label">Deductions on your payslip</div>
              <div className="settings-row__sublabel">Enter what your payslip shows. Leave blank if none.</div>
            </div>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={onEstimate}
              disabled={stats.gross <= 0 && loggedGross <= 0}
            >
              <Calculator size={14} />
              Estimate
            </button>
          </div>
          <div className="field-row">
            {DEDUCTION_FIELDS.map((f) => (
              <div className="field" key={f.key}>
                <label htmlFor={`ded-${f.key}`}>{f.label}</label>
                <MoneyInput
                  id={`ded-${f.key}`}
                  value={plan.deductions[f.key]}
                  onChange={(v) => setDeduction(f.key, v)}
                />
              </div>
            ))}
          </div>
          <p className="hint">
            Employers differ on which cutoff takes SSS, PhilHealth and Pag-IBIG, and a first paycheck is often
            shorter or has none yet. The estimate assumes the same pay every cutoff and splits each monthly
            contribution in two. Tax is not included. Your payslip always wins.
          </p>
        </div>
      </div>
    </section>
  );
}
