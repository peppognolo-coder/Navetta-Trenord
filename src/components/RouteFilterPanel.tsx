import { ArrowUpDown } from 'lucide-react';
import type { Direzione, Fermata } from '../types';

interface Props {
  fermate: Fermata[];
  origine: string;
  destinazione: string;
  direzione: Direzione;
  orario: string;
  periodicitaLabel: string;
  onOrigineChange: (v: string) => void;
  onDestinazioneChange: (v: string) => void;
  onDirezioneChange: (v: Direzione) => void;
  onOrarioChange: (v: string) => void;
  onSwap: () => void;
  onAdesso: () => void;
}

export default function RouteFilterPanel({
  fermate,
  origine,
  destinazione,
  direzione,
  orario,
  periodicitaLabel,
  onOrigineChange,
  onDestinazioneChange,
  onDirezioneChange,
  onOrarioChange,
  onSwap,
  onAdesso,
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex flex-col gap-3">
      {/* ORIGINE / SWAP / DESTINAZIONE */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
        <div>
          <label className="section-title text-[10px]">Partenza</label>
          <select
            value={origine}
            onChange={(e) => onOrigineChange(e.target.value)}
            className="admin-input mt-1"
          >
            <option value="">Qualsiasi fermata</option>
            {fermate.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
                {f.aRichiesta ? ' ✶' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onSwap}
          title="Inverti direzione"
          className="w-9 h-9 rounded-full bg-trenord-green/10 dark:bg-trenord-green/20 border border-gray-200 dark:border-gray-700 flex items-center justify-center active:scale-95 active:rotate-180 transition-transform"
        >
          <ArrowUpDown className="w-4 h-4 text-trenord-green-dark dark:text-trenord-green-light" />
        </button>

        <div>
          <label className="section-title text-[10px]">Destinazione</label>
          <select
            value={destinazione}
            onChange={(e) => onDestinazioneChange(e.target.value)}
            className="admin-input mt-1"
          >
            <option value="">Qualsiasi fermata</option>
            {fermate.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
                {f.aRichiesta ? ' ✶' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DIREZIONE */}
      <div>
        <label className="section-title text-[10px]">Direzione</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {(['A', 'B'] as Direzione[]).map((d) => (
            <button
              key={d}
              onClick={() => onDirezioneChange(d)}
              className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                direzione === d
                  ? 'bg-trenord-green text-white'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {d === 'A' ? '→ Verso Fiera' : '← Da Fiera'}
            </button>
          ))}
        </div>
      </div>

      {/* ORARIO */}
      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <div>
          <label className="section-title text-[10px]">Orario di partenza</label>
          <input
            type="time"
            value={orario}
            onChange={(e) => onOrarioChange(e.target.value)}
            className="admin-input mt-1"
          />
        </div>
        <button
          onClick={onAdesso}
          className="bg-trenord-green/10 dark:bg-trenord-green/20 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-trenord-green-dark dark:text-trenord-green-light active:scale-95 transition-transform"
        >
          Adesso
        </button>
      </div>

      {/* PERIODICITÀ ATTIVA OGGI */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-trenord-green animate-pulse flex-shrink-0" />
        <span>{periodicitaLabel}</span>
      </div>
    </div>
  );
}
