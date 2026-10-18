import { ListPlus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { BudgetGroup, BudgetItem, BudgetPlan } from '../../types';
import { GROUPS, uid, type BudgetStats } from '../../utils/budget';
import { formatCurrency } from '../../utils/calculations';
import { MoneyInput } from '../MoneyInput';

interface EnvelopesProps {
  plan: BudgetPlan;
  stats: BudgetStats;
  hasPreviousPlan: boolean;
  onItemsChange: (items: BudgetItem[]) => void;
  onStarter: () => void;
  onCopyPrevious: () => void;
}

export function Envelopes({ plan, stats, hasPreviousPlan, onItemsChange, onStarter, onCopyPrevious }: EnvelopesProps) {
  const [drafts, setDrafts] = useState<Record<BudgetGroup, string>>({ needs: '', wants: '', savings: '' });

  const update = (id: string, patch: Partial<BudgetItem>) =>
    onItemsChange(plan.items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const remove = (id: string) => onItemsChange(plan.items.filter((i) => i.id !== id));

  const add = (group: BudgetGroup) => {
    const name = drafts[group].trim();
    if (!name) return;
    onItemsChange([...plan.items, { id: uid(), name, group, planned: 0 }]);
    setDrafts((d) => ({ ...d, [group]: '' }));
  };

  return (
    <section className="card" aria-label="Envelopes">
      <div className="section-heading">
        <h2>Give every peso a job</h2>
        <span className="section-heading__hint">one envelope per cost</span>
      </div>

      {plan.items.length === 0 && (
        <div className="empty-state envelopes__empty">
          <strong>No envelopes yet</strong>
          <span>Start with a list built for a working student, or copy your last cutoff.</span>
          <div className="envelopes__empty-actions">
            <button type="button" className="btn btn--primary" onClick={onStarter}>
              <ListPlus size={16} />
              Use the starter list
            </button>
            {hasPreviousPlan && (
              <button type="button" className="btn btn--secondary" onClick={onCopyPrevious}>
                Copy last cutoff
              </button>
            )}
          </div>
        </div>
      )}

      {GROUPS.map((g) => {
        const items = plan.items.filter((i) => i.group === g.key);
        const over = g.key !== 'savings' && stats.planned[g.key] > stats.targets[g.key];
        return (
          <div className="envelope-group" key={g.key}>
            <div className="envelope-group__head">
              <span className="envelope-group__title">
                <span className="status-dot" style={{ background: g.color }} aria-hidden="true" />
                {g.label}
                <small>{g.hint}</small>
              </span>
              <span className={`tabular envelope-group__sum${over ? ' is-over' : ''}`}>
                {formatCurrency(stats.planned[g.key])} / {formatCurrency(stats.targets[g.key])}
              </span>
            </div>

            {items.map((item) => {
              const spent = stats.spentByItem[item.id] ?? 0;
              const pct = item.planned > 0 ? Math.min(100, (spent / item.planned) * 100) : 0;
              const overspent = item.group !== 'savings' && spent > item.planned;
              return (
                <div className="envelope-row" key={item.id}>
                  <input
                    className="input envelope-row__name"
                    value={item.name}
                    aria-label="Envelope name"
                    maxLength={40}
                    onChange={(e) => update(item.id, { name: e.target.value })}
                  />
                  <MoneyInput
                    className="envelope-row__amount"
                    label={`${item.name} amount`}
                    value={item.planned}
                    onChange={(v) => update(item.id, { planned: v })}
                  />
                  <button
                    type="button"
                    className="btn btn--ghost btn--icon envelope-row__remove"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="envelope-row__meta">
                    {item.group === 'savings' ? (
                      <label className="envelope-row__check">
                        <input
                          type="checkbox"
                          checked={Boolean(item.done)}
                          onChange={(e) => update(item.id, { done: e.target.checked })}
                        />
                        Moved out of my spending money
                      </label>
                    ) : (
                      <>
                        <div className="progress" aria-hidden="true">
                          <div
                            className={`progress__fill${overspent ? ' is-over' : ''}`}
                            style={{ width: `${pct}%`, background: overspent ? undefined : g.color }}
                          />
                        </div>
                        <span className={`tabular envelope-row__left${overspent ? ' is-over' : ''}`}>
                          {overspent
                            ? `${formatCurrency(spent - item.planned)} over`
                            : `${formatCurrency(item.planned - spent)} left`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="envelope-add">
              <input
                className="input"
                placeholder={`Add a ${g.label.toLowerCase().replace(/s$/, '')} envelope`}
                value={drafts[g.key]}
                maxLength={40}
                aria-label={`New ${g.label} envelope name`}
                onChange={(e) => setDrafts((d) => ({ ...d, [g.key]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') add(g.key);
                }}
              />
              <button
                type="button"
                className="btn btn--secondary btn--icon"
                aria-label={`Add ${g.label} envelope`}
                onClick={() => add(g.key)}
                disabled={!drafts[g.key].trim()}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
