import { format, parseISO } from 'date-fns';
import { Receipt, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { BudgetExpense, BudgetPlan } from '../../types';
import { uid } from '../../utils/budget';
import { dateKey, formatCurrency } from '../../utils/calculations';
import { MoneyInput } from '../MoneyInput';

interface SpendingLogProps {
  plan: BudgetPlan;
  onAdd: (expense: BudgetExpense) => void;
  onRemove: (id: string) => void;
}

export function SpendingLog({ plan, onAdd, onRemove }: SpendingLogProps) {
  const spendable = plan.items.filter((i) => i.group !== 'savings');
  const [amount, setAmount] = useState(0);
  const [itemId, setItemId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(dateKey(new Date()));

  const chosen = spendable.some((i) => i.id === itemId) ? itemId : (spendable[0]?.id ?? '');
  const itemName = (id: string) => plan.items.find((i) => i.id === id)?.name ?? 'Removed envelope';

  const submit = () => {
    if (amount <= 0 || !chosen) return;
    onAdd({ id: uid(), date, itemId: chosen, amount, note: note.trim() });
    setAmount(0);
    setNote('');
  };

  const recent = [...plan.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <section className="card budget-spend" aria-label="Spending log">
      <div className="section-heading">
        <h2>Spending log</h2>
        <span className="section-heading__hint">{plan.expenses.length} logged</span>
      </div>

      {spendable.length === 0 ? (
        <div className="empty-state">
          <Receipt size={22} />
          <span>Add a needs or wants envelope first, then log what you spend from it.</span>
        </div>
      ) : (
        <div className="spend-form">
          <div className="field">
            <label htmlFor="spend-amount">Amount</label>
            <MoneyInput id="spend-amount" value={amount} onChange={setAmount} />
          </div>
          <div className="field">
            <label htmlFor="spend-item">Envelope</label>
            <select id="spend-item" className="select" value={chosen} onChange={(e) => setItemId(e.target.value)}>
              {spendable.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="spend-date">Date</label>
            <input
              id="spend-date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value || dateKey(new Date()))}
            />
          </div>
          <div className="field spend-form__note">
            <label htmlFor="spend-note">Note (optional)</label>
            <input
              id="spend-note"
              className="input"
              value={note}
              maxLength={60}
              placeholder="e.g. jeep to work"
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
          </div>
          <button type="button" className="btn btn--primary spend-form__submit" onClick={submit} disabled={amount <= 0}>
            Log spend
          </button>
        </div>
      )}

      {recent.length > 0 && (
        <ul className="spend-list">
          {recent.map((e) => (
            <li className="spend-list__row" key={e.id}>
              <div>
                <div className="spend-list__title">{e.note || itemName(e.itemId)}</div>
                <div className="spend-list__sub">
                  {itemName(e.itemId)} · {format(parseISO(e.date), 'MMM d')}
                </div>
              </div>
              <span className="tabular spend-list__amount">{formatCurrency(e.amount)}</span>
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                aria-label={`Delete ${e.note || itemName(e.itemId)}`}
                onClick={() => onRemove(e.id)}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
