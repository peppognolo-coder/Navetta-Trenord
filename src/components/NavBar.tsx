import { Bus, Sun, Moon, Shield } from 'lucide-react';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  /** Non ancora collegato: arriverà con l'admin panel (prossima fase) */
  onAdminAccess?: () => void;
}

export default function NavBar({ theme, onToggleTheme, onAdminAccess }: Props) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-trenord-green dark:bg-gray-900 text-white shadow-sm safe-top">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Bus className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-sm tracking-wide truncate block leading-tight">
              Navetta Trenord
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {onAdminAccess && (
            <button
              onClick={onAdminAccess}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
