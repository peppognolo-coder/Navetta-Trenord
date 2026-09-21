import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Corsa, Fermata, Direzione } from '../types';
import { periodicitaTag, remainingLabel } from '../lib/time';

interface Props {
  corsa: Corsa;
  fermate: Fermata[];
  origine: string;
  destinazione: string;
  orarioPartenza: string;
  isFirst: boolean;
}

function nomeFermata(fermate: Fermata[], id: string): string {
  return fermate.find((f) => f.id === id)?.nome ?? id;
}

function aRichiesta(fermate: Fermata[], id: string): boolean {
  return fermate.find((f) => f.id === id)?.aRichiesta ?? false;
}

function dirLabel(d: Direzione): string {
  return d === 'A' ? '→ vs Fiera' : '← da Fiera';
}

export default function CorsaCard({ corsa, fermate, origine, destinazione, orarioPartenza, isFirst }: Props) {
  const [expanded, setExpanded] = useState(false);

  const rem = remainingLabel(orarioPartenza);
  const isImminente = rem?.urgency === 'imminent';

  const origStop = origine
    ? corsa.stops.find((s) => s.fermataId === origine)
    : corsa.stops[0];
  const destStop = destinazione
    ? corsa.stops.find((s) => s.fermataId === destinazione)
    : corsa.stops[corsa.stops.length - 1];

  const badgeClasses =
    rem?.urgency === 'imminent'
      ? 'bg-amber-500 dark:bg-amber-500 text-white'
      : rem?.urgency === 'soon'
      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
      : 'bg-trenord-green/10 dark:bg-trenord-green/20 text-trenord-green-dark dark:text-trenord-green-light';

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-transform active:scale-[0.99] card-hover ${
        isImminente
          ? 'bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-400 dark:border-amber-600 shadow-md shadow-amber-200/60 dark:shadow-amber-950/40'
          : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm'
      } ${
        isImminente
          ? 'border-l-[6px] border-l-amber-500 dark:border-l-amber-500'
          : isFirst
          ? 'border-l-4 border-l-trenord-green'
          : 'border-l-4 border-l-trenord-green/30'
      }`}
    >
      {isFirst && (
        <span className="absolute top-3 right-3.5 bg-trenord-green text-white text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded">
          Prossima
        </span>
      )}
      {isImminente && !isFirst && (
        <span className="absolute top-3 right-3.5 bg-amber-500 text-white text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded">
          In partenza
        </span>
      )}

      <div className="flex items-start justify-between mb-2 pr-16">
        <div
          className={`text-[28px] font-extrabold leading-none tracking-tight ${
            isImminente ? 'text-amber-900 dark:text-amber-200' : 'text-gray-900 dark:text-gray-50'
          }`}
        >
          {orarioPartenza}
        </div>
        {rem && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${badgeClasses}`}>
            {rem.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap text-[13px]">
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          {origStop ? nomeFermata(fermate, origStop.fermataId) : '—'}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-trenord-green flex-shrink-0" />
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          {destStop ? nomeFermata(fermate, destStop.fermataId) : '—'}
        </span>
        {destinazione && destStop && (
          <span className="text-[11px] text-gray-400 ml-1">arr. {destStop.orario}</span>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col">
          {corsa.stops.map((s, i) => {
            const highlighted =
              s.fermataId === (origine || corsa.stops[0]?.fermataId) ||
              s.fermataId === (destinazione || corsa.stops[corsa.stops.length - 1]?.fermataId);
            return (
              <div key={i} className="relative flex items-center gap-2 py-0.5 text-xs">
                {i !== corsa.stops.length - 1 && (
                  <span className="absolute left-[3px] top-4 w-px h-[calc(100%-4px)] bg-gray-200 dark:bg-gray-700" />
                )}
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 z-10 ${
                    highlighted ? 'bg-trenord-green' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <span
                  className={`min-w-[36px] font-bold ${
                    highlighted ? 'text-trenord-green-dark dark:text-trenord-green-light' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s.orario}
                </span>
                <span className={highlighted ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                  {nomeFermata(fermate, s.fermataId)}
                  {aRichiesta(fermate, s.fermataId) && (
                    <span className="ml-1 text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded">
                      A RICHIESTA
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          <p className="text-[10px] text-gray-300 dark:text-gray-600 text-center mt-1.5">
            Tocca di nuovo per chiudere
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
          {periodicitaTag(corsa.periodicita)}
        </span>
        <span className="text-[10px] text-gray-300 dark:text-gray-600">
          Corsa {corsa.id.replace(/[ab]$/, '')}
        </span>
        <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-auto">
          {dirLabel(corsa.direzione)}
        </span>
      </div>
    </div>
  );
}
