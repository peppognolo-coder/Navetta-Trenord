import { useEffect, useState } from 'react';
import NavBar from './components/NavBar';
import AdminPinModal from './components/AdminPinModal';
import HomeScreen from './screens/HomeScreen';
import AdminScreen from './screens/AdminScreen';
import { useTheme } from './hooks/useTheme';
import { verifyAdminPin } from './lib/adminApi';

const ADMIN_PIN_KEY = 'navetta_admin_pin';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [adminPin, setAdminPin] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [modal, setModal] = useState<'login' | 'logout' | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Al mount, se c'è un PIN salvato, lo riverifica lato server prima di
  // fidarsi: il PIN in localStorage è solo comodità locale, l'accesso vero
  // è sempre deciso dal database (verify_admin_pin).
  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_PIN_KEY);
    if (!stored) return;
    (async () => {
      const valid = await verifyAdminPin(stored);
      if (valid) {
        setAdminPin(stored);
      } else {
        localStorage.removeItem(ADMIN_PIN_KEY);
      }
    })();
  }, []);

  async function handleLoginConfirm(pin?: string) {
    if (!pin) return;
    setCheckingPin(true);
    setPinError(null);
    const valid = await verifyAdminPin(pin);
    setCheckingPin(false);
    if (!valid) {
      setPinError('PIN non valido.');
      return;
    }
    localStorage.setItem(ADMIN_PIN_KEY, pin);
    setAdminPin(pin);
    setAdminMode(true);
    setModal(null);
  }

  function handleLogoutConfirm() {
    localStorage.removeItem(ADMIN_PIN_KEY);
    setAdminPin(null);
    setAdminMode(false);
    setModal(null);
  }

  function handleAdminAccess() {
    if (adminPin) {
      setAdminMode(true);
    } else {
      setPinError(null);
      setModal('login');
    }
  }

  return (
    <div className="min-h-full bg-gray-100 dark:bg-gray-950">
      <NavBar theme={theme} onToggleTheme={toggleTheme} onAdminAccess={handleAdminAccess} />

      {adminMode && adminPin ? (
        <AdminScreen
          adminPin={adminPin}
          onBack={() => setAdminMode(false)}
          onLogout={() => setModal('logout')}
        />
      ) : (
        <HomeScreen />
      )}

      {modal === 'login' && (
        <AdminPinModal
          mode="login"
          loading={checkingPin}
          error={pinError}
          onConfirm={handleLoginConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'logout' && (
        <AdminPinModal mode="logout" onConfirm={handleLogoutConfirm} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
