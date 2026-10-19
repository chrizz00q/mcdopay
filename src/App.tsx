import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppDataProvider } from './context/AppDataContext';
import { InstallBanner } from './components/InstallBanner';
import { Budget } from './pages/Budget';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <InstallBanner />
      </HashRouter>
    </AppDataProvider>
  );
}

export default App;
