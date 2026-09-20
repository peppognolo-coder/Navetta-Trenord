import { Star, X, Plus } from 'lucide-react';
import type { Favorita, Fermata } from '../types';

interface Props {
  favorites: Favorita[];
  max: number;
  fermate: Fermata[];
  onApply: (fav: Favorita) => void;
  onRemove: (index: number) => void;
  onAddCurrent: () => void;
}

function shortName(fermate: Fermata[], id: string | null): string {
  if (!id) return 'Qualsiasi';
  return fermate.find((f) => f.id === id)?.nome.split(' (')[0] ?? id;
}

export default function FavoritesList({ favorites, max, fermate, onApply, onRemove, onAddCurrent }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="section-title flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" /> Tratte preferite
        </span>
        {favorites.length > 0 && (
          <span className="text-[10px] text-gray-400">
            {favorites.length}/{max}
          </span>
        )}
      </div>

      {favorites.length === 0 ? (
        <p className="text-[11px] text-gray-400">
          Nessuna tratta salvata — configura i filtri e premi il pulsante.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {favorites.map((f, i) => (
            <button
              key={i}
              onClick={() => onApply(f)}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2.5 flex items-center gap-2 text-left shadow-sm active:scale-[0.99] transition-transform"
            >
              <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {shortName(fermate, f.origine)} → {shortName(fermate, f.destinazione)}
                </div>
                <div className="text-[10px] text-gray-400">
                  {f.direzione === 'A' ? '→ vs Fiera' : '← da Fiera'}
                </div>
              </div>
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onAddCurrent}
        className="w-full bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
      >
        <Plus className="w-3.5 h-3.5" /> Salva tratta corrente
      </button>
    </div>
  );
}
