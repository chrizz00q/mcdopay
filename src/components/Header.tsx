import { Moon, Sun, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

interface HeaderProps {
  subtitle: string;
}

export function Header({ subtitle }: HeaderProps) {
  const { settings, updateSettings } = useAppData();
  const toggleTheme = () => {
    updateSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  return (
    <>
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__mark" aria-hidden="true">
          <Wallet size={20} strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="app-header__title">{settings.appName}</h1>
          <p className="app-header__subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="app-header__actions">
        <button
          type="button"
          className="icon-toggle"
          onClick={toggleTheme}
          aria-label={settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
    <nav className="app-nav" aria-label="Main">
      {[
        { to: '/', label: 'Dashboard', end: true },
        { to: '/budget', label: 'Budget', end: false },
        { to: '/settings', label: 'Settings', end: false },
      ].map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className="app-nav__tab">
          {tab.label}
        </NavLink>
      ))}
    </nav>
    </>
  );
}
