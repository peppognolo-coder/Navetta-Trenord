import { useEffect, useMemo, useState } from 'react';
import { Bus, AlertTriangle } from 'lucide-react';
import { useOrari } from '../hooks/useOrari';
import { useFavorites } from '../hooks/useFavorites';
import RouteFilterPanel from '../components/RouteFilterPanel';
import FavoritesList from '../components/FavoritesList';
import CorsaCard from '../components/CorsaCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  nowHHMM,
  nowMinutes,
  periodicitaLabel,
  toMinutes,
  tipoGiorno,
  corsaValidaOggi,
} from '../lib/time';
import type { Direzione, Favorita } from '../types';

export default function HomeScreen() {
  const { fermate, corse, festivita, loading, error, lastUpdated } = useOrari();
  const { favorites, add, remove, max } = useFavorites();

  const [origine, setOrigine] = useState('');
  const [destinazione, setDestinazione] = useState('');
  const [direzione, setDirezione] = useState<Direzione>('A');
  const [orario, setOrario] = useState('');
  const [clock, setClock] = useState(nowHHMM());
  const [savedFeedback, setSavedFeedback] = useState(false);

  // orologio in testa alla pagina, aggiornato ogni 30s (stesso comportamento
  // della versione vanilla-JS)
  useEffect(() => {
    const t = setInterval(() => setClock(nowHHMM()), 30_000);
    return () => clearInterval(t);
  }, []);

  const giorno = useMemo(() => tipoGiorno(festivita), [festivita]);

  const corseFiltrate = useMemo(() => {
    const now = nowMinutes(orario || undefined);
    return corse
      .filter((c) => c.direzione === direzione && corsaValidaOggi(c.periodicita, giorno))
      .filter((c) => {
        if (origine && !c.stops.some((s) => s.fermataId === origine)) return false;
        if (destinazione && !c.stops.some((s) => s.fermataId === destinazione)) return false;
        if (origine && destinazione) {
          const oi = c.stops.findIndex((s) => s.fermataId === origine);
          const di = c.stops.findIndex((s) => s.fermataId === destinazione);
          if (oi === -1 || di === -1 || oi >= di) return false;
        }
        const partenza = origine
          ? c.stops.find((s) => s.fermataId === origine)?.orario
          : c.stops[0]?.orario;
        return partenza ? toMinutes(partenza) >= now : false;
      })
      .sort((a, b) => {
        const ta = (origine ? a.stops.find((s) => s.fermataId === origine)?.orario : a.stops[0]?.orario) ?? '';
        const tb = (origine ? b.stops.find((s) => s.fermataId === origine)?.orario : b.stops[0]?.orario) ?? '';
        return toMinutes(ta) - toMinutes(tb);
      })
      .slice(0, 5);
  }, [corse, direzione, giorno, origine, destinazione, orario]);

  function handleSwap() {
    const o = origine;
    setOrigine(destinazione);
    setDestinazione(o);
    setDirezione((d) => (d === 'A' ? 'B' : 'A'));
  }

  function handleAdesso() {
    setOrario('');
  }

  function handleAddCurrent() {
    const result = add({ origine: origine || null, destinazione: destinazione || null, direzione });
    if (result === 'empty') {
      alert('Seleziona almeno una fermata di partenza o destinazione prima di salvare.');
      return;
    }
    if (result === 'full') {
      alert(`Puoi salvare al massimo ${max} tratte preferite.`);
      return;
    }
    if (result === 'duplicate') {
      alert('Questa tratta è già nei preferiti.');
      return;
    }
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1800);
  }

  function handleApplyFavorite(fav: Favorita) {
    setOrigine(fav.origine ?? '');
    setDestinazione(fav.destinazione ?? '');
    setDirezione(fav.direzione);
    setOrario('');
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <LoadingSpinner message="Caricamento orari..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <EmptyState icon={AlertTriangle} title="Orari non disponibili" description={error} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-[72px] pb-10 flex flex-col gap-4">
      {/* OROLOGIO */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
        <span>Trenord · in vigore dal 1 maggio 2026</span>
        <span className="font-mono font-semibold text-gray-600 dark:text-gray-300">{clock}</span>
      </div>

      <RouteFilterPanel
        fermate={fermate}
        origine={origine}
        destinazione={destinazione}
        direzione={direzione}
        orario={orario}
        periodicitaLabel={periodicitaLabel(giorno)}
        onOrigineChange={setOrigine}
        onDestinazioneChange={setDestinazione}
        onDirezioneChange={setDirezione}
        onOrarioChange={setOrario}
        onSwap={handleSwap}
        onAdesso={handleAdesso}
      />

      <FavoritesList
        favorites={favorites}
        max={max}
        fermate={fermate}
        onApply={handleApplyFavorite}
        onRemove={remove}
        onAddCurrent={handleAddCurrent}
      />
      {savedFeedback && (
        <p className="text-[11px] text-trenord-green-dark dark:text-trenord-green-light text-center -mt-2">
          ✓ Tratta salvata
        </p>
      )}

      <div className="flex items-center justify-between px-1">
        <span className="section-title">Prossime corse</span>
        <span className="text-[11px] text-gray-400">
          {corseFiltrate.length === 0
            ? ''
            : corseFiltrate.length === 1
            ? '1 corsa'
            : `${corseFiltrate.length} corse`}
        </span>
      </div>

      {corseFiltrate.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="Nessuna corsa disponibile"
          description="Nessuna corsa trovata con questi filtri. Prova a cambiare fermata, direzione o orario."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {corseFiltrate.map((c, i) => {
            const partenza =
              (origine ? c.stops.find((s) => s.fermataId === origine)?.orario : c.stops[0]?.orario) ?? '--:--';
            return (
              <CorsaCard
                key={`${c.id}-${c.direzione}`}
                corsa={c}
                fermate={fermate}
                origine={origine}
                destinazione={destinazione}
                orarioPartenza={partenza}
                isFirst={i === 0}
              />
            );
          })}
        </div>
      )}

      <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 flex items-center justify-center gap-1.5 mt-1">
        <span className="w-1 h-1 rounded-full bg-trenord-green animate-pulse" />
        {lastUpdated
          ? `Aggiornato alle ${lastUpdated.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · auto ogni 60s`
          : 'Aggiornamento automatico ogni 60s'}
      </p>
    </div>
  );
}
