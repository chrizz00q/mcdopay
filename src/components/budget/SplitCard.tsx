import { Copy } from 'lucide-react';
import type { BudgetGroup, BudgetPlan, RuleKey } from '../../types';
import { GROUPS, RULES, type BudgetStats } from '../../utils/budget';
import { formatCurrency } from '../../utils/calculations';

interface SplitCardProps {
  plan: BudgetPlan;
  stats: BudgetStats;
  onChange: (patch: Partial<BudgetPlan>) => void;
  onCopy: () => void;
}

const RULE_KEYS: RuleKey[] = ['balanced', 'needs-heavy', 'goal', 'custom'];

export function SplitCard({ plan, stats, onChange, onCopy }: SplitCardProps) {
  const chooseRule = (rule: RuleKey) => {
    if (rule === 'custom') onChange({ rule });
    else onChange({ rule, split: { ...RULES[rule].split } });
  };

  const setCustom = (group: 'needs' | 'wants', raw: string) => {
    const n = Math.max(0, Math.min(100, Math.round(Number(raw) || 0)));
    const next = { ...plan.split, [group]: n };
    next.savings = Math.max(0, 100 - next.needs - next.wants);
    onChange({ split: next, rule: 'custom' });
  };

  const scale = Math.max(stats.net, stats.totalPlanned, 1);
  const unassignedPct = stats.unassigned > 0 ? (stats.unassigned / scale) * 100 : 0;
  const customTotal = plan.split.needs + plan.split.wants;

  return (
    <section className="card" aria-label="How to split your take-home">
      <div className="section-heading">
        <h2>Split your take-home</h2>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCopy}>
          <Copy size={14} />
          Copy plan
        </button>
      </div>

      <div className="segmented split-card__rules" role="group" aria-label="Budget rule">
        {RULE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="segmented__option"
            data-active={plan.rule === key}
            onClick={() => chooseRule(key)}
          >
            {key === 'custom' ? 'Custom' : RULES[key].label}
          </button>
        ))}
      </div>
      <p className="hint">
        {plan.rule === 'custom'
          ? 'Set needs and wants. Savings gets whatever is left.'
          : `${RULES[plan.rule].description} Needs, wants, savings.`}
      </p>

      {plan.rule === 'custom' && (
        <div className="field-row" style={{ marginTop: 'var(--space-3)' }}>
          <div className="field">
            <label htmlFor="split-needs">Needs %</label>
            <input
              id="split-needs"
              className="input tabular"
              type="number"
              min={0}
              max={100}
              value={plan.split.needs}
              onChange={(e) => setCustom('needs', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="split-wants">Wants %</label>
            <input
              id="split-wants"
              className="input tabular"
              type="number"
              min={0}
              max={100}
              value={plan.split.wants}
              onChange={(e) => setCustom('wants', e.target.value)}
            />
          </div>
          {customTotal > 100 && <p className="field__error">Needs and wants add up to more than 100%.</p>}
        </div>
      )}

      <div
        className="alloc-bar"
        role="img"
        aria-label={`Planned: needs ${formatCurrency(stats.planned.needs)}, wants ${formatCurrency(
          stats.planned.wants,
        )}, savings ${formatCurrency(stats.planned.savings)}, unassigned ${formatCurrency(stats.unassigned)}`}
      >
        {GROUPS.map((g) => (
          <span
            key={g.key}
            className="alloc-bar__seg"
            style={{ width: `${(stats.planned[g.key] / scale) * 100}%`, background: g.color }}
          />
        ))}
        {unassignedPct > 0 && <span className="alloc-bar__open" style={{ width: `${unassignedPct}%` }} />}
      </div>

      <div className="alloc-legend">
        {GROUPS.map((g) => {
          const key = g.key as BudgetGroup;
          const over = key !== 'savings' && stats.planned[key] > stats.targets[key];
          return (
            <div className="alloc-legend__item" key={g.key}>
              <span className="alloc-legend__name">
                <span className="status-dot" style={{ background: g.color }} aria-hidden="true" />
                {g.label} · {plan.split[key]}%
              </span>
              <span className={`alloc-legend__value tabular${over ? ' is-over' : ''}`}>
                {formatCurrency(stats.planned[key])}
              </span>
              <span className="alloc-legend__target">of {formatCurrency(stats.targets[key])}</span>
            </div>
          );
        })}
      </div>

      <div className={`alloc-remaining${stats.unassigned < 0 ? ' is-over' : ''}`}>
        <span>{stats.unassigned < 0 ? 'Over your take-home by' : 'Not assigned yet'}</span>
        <strong className="tabular">{formatCurrency(Math.abs(stats.unassigned))}</strong>
      </div>
    </section>
  );
}
