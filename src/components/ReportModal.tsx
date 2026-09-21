import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Send, Check } from 'lucide-react';
import { useScrollLock } from '../lib/useScrollLock';
import { supabase } from '../lib/supabase';

export type TipoSegnalazione = 'orario_errato' | 'corsa_cancellata' | 'fermata_mancante' | 'altro';

const TIPI: { value: TipoSegnalazione; label: string }[] = [
  { value: 'orario_errato', label: 'Orario errato' },
  { value: 'corsa_cancellata', label: 'Corsa cancellata' },
  { value: 'fermata_mancante', label: 'Fermata mancante' },
  { value: 'altro', label: 'Altro' },
];

interface Props {
  onClose: () => void;
  /** Precompilati se il modal si apre da una corsa specifica (card espansa). */
  corsaId?: string; // uuid reale (corse.id), non il codice
  corsaLabel?: string; // es. "Corsa 176 · direzione A"
  fermataId?: string; // uuid reale (fermate.id)
}

/**
 * Invio pubblico e anonimo: scrive direttamente su `segnalazioni` con il
 * client Supabase (chiave anon) — la RLS della tabella permette l'insert
 * pubblico, quindi non serve passare da una Netlify Function per questo.
 * Solo la lettura/gestione lato admin richiede il service_role.
 */
export default function ReportModal({ onClose, corsaId, corsaLabel, fermataId }: Props) {
  useScrollLock();

  const [tipo, setTipo] = useState<TipoSegnalazione>(corsaId ? 'orario_errato' : 'altro');
  const [descrizione, setDescrizione] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setSending(true);
    setError(null);
    const { error: insErr } = await supabase.from('segnalazioni').insert({
      tipo,
      corsa_id: corsaId ?? null,
      fermata_id: fermataId ?? null,
      descrizione: descrizione.trim() || null,
    });
    setSending(false);
    if (insErr) {
      setError('Invio non riuscito. Controlla la connessione e riprova.');
      return;
    }
    setDone(true);
    setTimeout(onClose, 1600);
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-2xl animate-slide-up">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full bg-trenord-green/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-trenord-green" />
            </div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Segnalazione inviata</p>
            <p className="text-xs text-gray-400 text-center">Grazie, il team la prenderà in carico.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Segnala un problema</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {corsaLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                Riferita a: <span className="font-semibold">{corsaLabel}</span>
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Tipo di problema</label>
              <div className="grid grid-cols-2 gap-2">
                {TIPI.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      tipo === t.value
                        ? 'bg-trenord-green text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Descrizione (opzionale)</label>
              <textarea
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                rows={3}
                placeholder="Es. l'orario delle 08:10 in realtà è alle 08:15"
                className="admin-input resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={sending}
              className="flex items-center justify-center gap-2 bg-trenord-green text-white rounded-2xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'Invio...' : 'Invia segnalazione'}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
