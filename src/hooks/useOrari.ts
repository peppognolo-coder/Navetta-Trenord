import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Corsa, Fermata } from '../types';

// Indirizzi estesi — non sono in tabella `fermate` (che ha solo il nome
// breve). Se un domani li aggiungi come colonna, si può spostare tutto
// lato DB e togliere questa mappa.
const INDIRIZZI: Record<string, string> = {
  greco: 'MI Greco P. (p.le Egeo / via Cozzi)',
  centrale: 'Stazione Centrale (p.za IV Novembre)',
  garibaldi: 'Stazione FS Garibaldi',
  srocco: 'S. Rocco – Ferrotel (via Calvino)',
  bovisa: 'Stazione FN Bovisa (via Siccoli)',
  certosa: 'Certosa – via Triboniano civ. 13',
  cimitero: 'Cimitero Maggiore – via Barzaghi',
  acs: 'CABINA ACS – via Triboniano',
  mensa: 'Mensa Fiorenza',
  fiera: 'Ingresso Lato Fiera',
};

const REFRESH_MS = 60_000;

interface OrariState {
  fermate: Fermata[];
  corse: Corsa[];
  festivita: string[]; // date ISO 'YYYY-MM-DD'
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Carica fermate/corse/festivita da Supabase e le ricarica ogni 60s, così
 * una modifica fatta dall'admin arriva agli utenti senza dover riaprire
 * l'app — stessa cadenza dell'auto-refresh già presente nella versione
 * vanilla-JS.
 */
export function useOrari() {
  const [state, setState] = useState<OrariState>({
    fermate: [],
    corse: [],
    festivita: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const load = useCallback(async (isBackground: boolean) => {
    if (!isBackground) setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const { data: fermateRows, error: errF } = await supabase
        .from('fermate')
        .select('codice, nome, a_richiesta')
        .eq('attiva', true)
        .order('ordine_default');
      if (errF) throw errF;

      const fermate: Fermata[] = (fermateRows ?? []).map((f) => ({
        id: f.codice,
        nome: INDIRIZZI[f.codice] ?? f.nome,
        aRichiesta: f.a_richiesta,
      }));

      const { data: corseRows, error: errC } = await supabase
        .from('corse')
        .select(
          `
          codice, direzione,
          tipi_servizio ( codice ),
          corse_fermate ( orario, ordine, fermate ( codice ) )
        `
        )
        .eq('attiva', true);
      if (errC) throw errC;

      const corse: Corsa[] = (corseRows ?? []).map((c: any) => ({
        id: c.codice,
        periodicita: c.tipi_servizio.codice,
        direzione: c.direzione,
        stops: [...c.corse_fermate]
          .sort((a: any, b: any) => a.ordine - b.ordine)
          .map((cf: any) => ({ fermataId: cf.fermate.codice, orario: cf.orario.slice(0, 5) })),
      }));

      const { data: festRows, error: errFe } = await supabase.from('festivita').select('data');
      if (errFe) throw errFe;
      const festivita = (festRows ?? []).map((r) => r.data as string);

      setState({ fermate, corse, festivita, loading: false, error: null, lastUpdated: new Date() });
    } catch (err) {
      console.error('Errore caricamento orari da Supabase:', err);
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Impossibile contattare il database degli orari. Controlla la connessione e riprova.',
      }));
    }
  }, []);

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { ...state, reload: () => load(false) };
}
