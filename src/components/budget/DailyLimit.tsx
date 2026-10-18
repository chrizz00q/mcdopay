import { CalendarClock } from 'lucide-react';
import type { BudgetPlan } from '../../types';
import type { BudgetStats, DailyAllowance } from '../../utils/budget';
import { formatCurrency } from '../../utils/calculations';

interface DailyLimitProps {
  plan: BudgetPlan;
  stats: BudgetStats;
  allowance: DailyAllowance;
  onChange: (patch: Partial<BudgetPlan>) => void;
}

export function DailyLimit({ plan, stats, allowance, onChange }: DailyLimitProps) {
  const empty = stats.planned.needs + stats.planned.wants === 0;
  return (
    <section className="card card--tight daily" aria-label="Daily limit">
      <div className="section-heading">
        <h2>Daily limit</h2>
        <CalendarClock size={16} color="var(--text-muted)" aria-hidden="true" />
      </div>

      <div className="daily__figure tabular">{empty ? '—' : formatCurrency(allowance.perDay)}</div>
      <p className="daily__caption">
        {empty
          ? 'Plan some needs or wants to get a daily limit.'
          : stats.spendableLeft < 0
            ? `You have spent ${formatCurrency(Math.abs(stats.spendableLeft))} more than planned.`
            : `${formatCurrency(stats.spendableLeft)} left across needs and wants, over ${allowance.days} day${
                allowance.days === 1 ? '' : 's'
              }${allowance.assumed ? ' (assuming 15 until you set your next payday)' : ''}.`}
      </p>

      <div className="field">
        <label htmlFor="payday">I get paid on</label>
        <input
          id="payday"
          type="date"
          className="input"
          value={plan.payday ?? ''}
          onChange={(e) => onChange({ payday: e.target.value || null })}
        />
      </div>
      <div className="field">
        <label htmlFor="next-payday">Next payday</label>
        <input
          id="next-payday"
          type="date"
          className="input"
          value={plan.nextPayday ?? ''}
          min={plan.payday ?? undefined}
          onChange={(e) => onChange({ nextPayday: e.target.value || null })}
        />
      </div>
    </section>
  );
}
