import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { AppSettings, BudgetMap, BudgetPlan, DayEntry, EntryMap } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS, clearAllStorage } from '../utils/storage';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Mcdopay',
  hourlyRate: 94,
  theme: 'dark',
  reminder: { enabled: false, time: '20:00' },
  restDays: [],
};

interface AppDataContextValue {
  entries: EntryMap;
  saveEntry: (entry: DayEntry) => void;
  removeEntry: (dateKey: string) => void;
  settings: AppSettings;
  updateSettings: (updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => void;
  budgets: BudgetMap;
  savePlan: (plan: BudgetPlan) => void;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; message: string };
  resetAllData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useLocalStorage<EntryMap>(STORAGE_KEYS.entries, {});
  const [settings, setSettings] = useLocalStorage<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [budgets, setBudgets] = useLocalStorage<BudgetMap>(STORAGE_KEYS.budgets, {});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    document.title = `${settings.appName} — Work Hours & Salary Tracker`;
  }, [settings.appName]);

  const saveEntry = (entry: DayEntry) => {
    setEntries((prev) => ({ ...prev, [entry.date]: entry }));
  };

  const removeEntry = (key: string) => {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateSettings = (
    updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings),
  ) => {
    setSettings((prev) =>
      typeof updater === 'function' ? updater(prev) : { ...prev, ...updater },
    );
  };

  const savePlan = (plan: BudgetPlan) => {
    setBudgets((prev) => ({ ...prev, [plan.cutoffId]: plan }));
  };

  const exportData = () =>
    JSON.stringify(
      { app: 'mcdopay', version: 1, exportedAt: new Date().toISOString(), entries, settings, budgets },
      null,
      2,
    );

  const importData = (json: string): { ok: boolean; message: string } => {
    try {
      const data = JSON.parse(json);
      const isObject = (v: unknown): v is Record<string, unknown> =>
        typeof v === 'object' && v !== null && !Array.isArray(v);
      if (!isObject(data) || data.app !== 'mcdopay' || !isObject(data.entries)) {
        return { ok: false, message: 'This does not look like a Mcdopay backup file.' };
      }
      const incomingSettings = isObject(data.settings) ? data.settings : {};
      const incomingReminder = isObject(incomingSettings.reminder) ? incomingSettings.reminder : {};
      setEntries(data.entries as EntryMap);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...(incomingSettings as Partial<AppSettings>),
        reminder: { ...DEFAULT_SETTINGS.reminder, ...incomingReminder },
      });
      setBudgets(isObject(data.budgets) ? (data.budgets as BudgetMap) : {});
      return { ok: true, message: 'Backup restored.' };
    } catch {
      return { ok: false, message: 'That file could not be read. Choose a .json backup from Mcdopay.' };
    }
  };

  const resetAllData = () => {
    clearAllStorage();
    setEntries({});
    setSettings(DEFAULT_SETTINGS);
    setBudgets({});
  };

  const value = useMemo(
    () => ({
      entries,
      saveEntry,
      removeEntry,
      settings,
      updateSettings,
      budgets,
      savePlan,
      exportData,
      importData,
      resetAllData,
    }),
    [entries, settings, budgets],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
