import { useCallback, useEffect, useState } from 'react';
import type { Favorita } from '../types';

const STORAGE_KEY = 'navetta_favs';
const MAX_FAVS = 5;

function load(): Favorita[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function persist(favs: Favorita[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  } catch {
    // localStorage non disponibile — i preferiti restano solo per questa sessione
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorita[]>(load);

  useEffect(() => persist(favorites), [favorites]);

  const add = useCallback((fav: Favorita): 'ok' | 'empty' | 'full' | 'duplicate' => {
    if (!fav.origine && !fav.destinazione) return 'empty';
    let result: 'ok' | 'full' | 'duplicate' = 'ok';
    setFavorites((prev) => {
      if (prev.length >= MAX_FAVS) {
        result = 'full';
        return prev;
      }
      const exists = prev.some(
        (f) => f.origine === fav.origine && f.destinazione === fav.destinazione && f.direzione === fav.direzione
      );
      if (exists) {
        result = 'duplicate';
        return prev;
      }
      return [...prev, fav];
    });
    return result;
  }, []);

  const remove = useCallback((index: number) => {
    setFavorites((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { favorites, add, remove, max: MAX_FAVS };
}
