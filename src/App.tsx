import NavBar from './components/NavBar';
import HomeScreen from './screens/HomeScreen';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-full bg-gray-100 dark:bg-gray-950">
      {/* onAdminAccess non passato: il pulsante admin compare quando
          costruiamo l'admin panel (prossima fase) */}
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <HomeScreen />
    </div>
  );
}
