// Helper orari — logica portata 1:1 dalla versione vanilla-JS già in
// produzione (toM/nowM/remBadge), solo riscritta in TS.

export function toMinutes(t: string | null | undefined): number {
  if (!t) return -1;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function nowMinutes(overrideTime?: string): number {
  if (overrideTime) return toMinutes(overrideTime);
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

export function nowHHMM(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

/** Etichetta del tempo mancante a una partenza, es. "tra 5 min", "tra 1h20m" */
export function remainingLabel(orario: string): { label: string; urgency: 'normal' | 'soon' | 'imminent' } | null {
  const diff = toMinutes(orario) - nowMinutes();
  if (diff < 0) return null;
  const urgency = diff <= 3 ? 'imminent' : diff <= 10 ? 'soon' : 'normal';
  const label =
    diff === 0
      ? 'Adesso'
      : diff < 60
      ? `tra ${diff} min`
      : `tra ${Math.floor(diff / 60)}h${diff % 60 ? diff % 60 + 'm' : ''}`;
  return { label, urgency };
}

/**
 * Tipo di giorno odierno secondo il calendario festività (tabella
 * `festivita`): FEST se oggi è domenica o è tra le date festive, SAB se
 * sabato, FER altrimenti. Coerente con la periodicità FE/FS/F/G dello schema.
 */
export function tipoGiorno(festivita: string[]): 'FER' | 'SAB' | 'FEST' {
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  const dw = d.getDay(); // 0 = domenica, 6 = sabato
  if (festivita.includes(iso) || dw === 0) return 'FEST';
  if (dw === 6) return 'SAB';
  return 'FER';
}

export function corsaValidaOggi(per: string, tipo: 'FER' | 'SAB' | 'FEST'): boolean {
  if (per === 'G') return true;
  if (per === 'FE') return tipo === 'FEST';
  if (per === 'FS') return tipo === 'FER' || tipo === 'SAB';
  return tipo === 'FER'; // F = lun-ven
}

export function periodicitaLabel(giorno: 'FER' | 'SAB' | 'FEST'): string {
  return {
    FER: 'Giorno feriale lun–ven',
    SAB: 'Sabato · orario lun–sab',
    FEST: 'Festivo/domenica · orario festivo',
  }[giorno];
}

export function periodicitaTag(per: string): string {
  return { G: 'Tutti i giorni', F: 'Lun–Ven', FS: 'Lun–Sab', FE: 'Festivo' }[per] ?? per;
}
