import { format } from 'date-fns';
import { CalendarDays, Clock, PiggyBank, RotateCcw, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from '../components/Calendar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EntryModal } from '../components/EntryModal';
import { Header } from '../components/Header';
import { RateLegend } from '../components/RateLegend';
import { SummaryCard } from '../components/SummaryCard';
import { Toast } from '../components/Toast';
import { useAppData } from '../context/AppDataContext';
import { useDailyReminder } from '../hooks/useDailyReminder';
import { makeCutoffId } from '../utils/budget';
import {
  computeMonthSummary,
  dateKey,
  formatCurrency,
  formatHours,
  withScheduledRestDay,
} from '../utils/calculations';

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
] as const;

export function Dashboard() {
  const { entries, saveEntry, removeEntry, settings, updateSettings, resetAllData } = useAppData();
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useDailyReminder(settings.reminder, settings.appName);

  const summary = useMemo(
    () => computeMonthSummary(entries, monthDate, settings.hourlyRate),
    [entries, monthDate, settings.hourlyRate],
  );

  const selectedEntry = selectedDay
    ? entries[dateKey(selectedDay)] ??
      withScheduledRestDay(undefined, selectedDay, settings.restDays)
    : undefined;

  const toggleRestDay = (weekday: (typeof WEEKDAYS)[number]['value']) => {
    updateSettings((previous) => ({
      ...previous,
      restDays: previous.restDays.includes(weekday)
        ? previous.restDays.filter((day) => day !== weekday)
        : [...previous.restDays, weekday],
    }));
  };

  const handleReset = () => {
    resetAllData();
    setConfirmReset(false);
    setToast('All data has been reset.');
  };

  return (
    <div className="app-shell">
      <Header subtitle={`${format(monthDate, 'MMMM yyyy')} · payroll overview`} />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="summary-grid">
            <SummaryCard
              icon={Wallet}
              label="Monthly earnings"
              value={formatCurrency(summary.totalPay)}
              meta={`${summary.daysWorked} day${summary.daysWorked === 1 ? '' : 's'} logged`}
              accent="accent"
            />
            <SummaryCard
              icon={Clock}
              label="Total hours"
              value={`${formatHours(summary.totalHours)}h`}
              meta={`Base rate ${formatCurrency(settings.hourlyRate)}/hr`}
            />
            <SummaryCard
              icon={CalendarDays}
              label="Days worked"
              value={`${summary.daysWorked}`}
              meta={format(monthDate, 'MMMM yyyy')}
            />
          </div>

          <div className="card">
            <Calendar
              monthDate={monthDate}
              onMonthChange={setMonthDate}
              entries={entries}
              restDays={settings.restDays}
              onSelectDay={setSelectedDay}
            />
          </div>

          <div className="cutoff-grid">
            <div className="card card--tight">
              <div className="section-heading">
                <h2>{summary.firstCutoff.label}</h2>
              </div>
              <div className="summary-card__value tabular" style={{ fontSize: '1.25rem' }}>
                {formatCurrency(summary.firstCutoff.totalPay)}
              </div>
              <div className="summary-card__label">{formatHours(summary.firstCutoff.totalHours)}h logged</div>
              <Link
                className="btn btn--secondary btn--sm cutoff-budget-link"
                to={`/budget?c=${makeCutoffId(monthDate, 1)}`}
              >
                <PiggyBank size={14} />
                Plan this budget
              </Link>
            </div>
            <div className="card card--tight">
              <div className="section-heading">
                <h2>{summary.secondCutoff.label}</h2>
              </div>
              <div className="summary-card__value tabular" style={{ fontSize: '1.25rem' }}>
                {formatCurrency(summary.secondCutoff.totalPay)}
              </div>
              <div className="summary-card__label">{formatHours(summary.secondCutoff.totalHours)}h logged</div>
              <Link
                className="btn btn--secondary btn--sm cutoff-budget-link"
                to={`/budget?c=${makeCutoffId(monthDate, 2)}`}
              >
                <PiggyBank size={14} />
                Plan this budget
              </Link>
            </div>
          </div>
        </div>

        <div className="dashboard-side">
          <section className="card card--tight restday-schedule">
            <div className="section-heading">
              <h2>When is your rest day?</h2>
            </div>
            <p className="restday-schedule__hint">
              Select the weekday(s) you take off. They will be marked as rest days every week.
            </p>
            <div className="restday-schedule__days" role="group" aria-label="Weekly rest days">
              {WEEKDAYS.map(({ value, label }) => {
                const selected = settings.restDays.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    className="restday-schedule__day"
                    data-active={selected}
                    aria-pressed={selected}
                    onClick={() => toggleRestDay(value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <RateLegend hourlyRate={settings.hourlyRate} />

          <div className="card card--tight">
            <button type="button" className="btn btn--danger btn--block" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={16} />
              Reset all data
            </button>
          </div>
        </div>
      </div>

      {selectedDay && (
        <EntryModal
          date={selectedDay}
          entry={selectedEntry}
          hourlyRate={settings.hourlyRate}
          onClose={() => setSelectedDay(null)}
          onSave={saveEntry}
          onClear={removeEntry}
        />
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Reset all data?"
          message="This permanently deletes every logged entry, your hourly rate, theme, and reminder settings from this device. This cannot be undone."
          confirmLabel="Reset everything"
          onConfirm={handleReset}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
