import { TrainFront, ArrowRight } from 'lucide-react';

// Parametri UTM standard, per distinguere il traffico proveniente da questo
// banner quando si guardano le statistiche di Supremi Advisor (Netlify
// Analytics, Google Analytics, Plausible... qualunque cosa venga collegata,
// tutte riconoscono questa convenzione senza bisogno di configurazione extra
// da parte di Supremi Advisor).
const SUPREMI_ADVISOR_URL =
  'https://supremi-advisor.netlify.app/?utm_source=navetta-trenord&utm_medium=app&utm_campaign=cross-promo-banner';

/**
 * Cross-promo discreta verso Supremi Advisor. Non un popup, non dismissibile
 * in modo permanente (nessun bisogno: è una singola card in fondo alla lista
 * filtri, non blocca nulla) — solo un link in linea con lo stile dell'app.
 */
export default function SupremiAdvisorBanner() {
  return (
    <a
      href={SUPREMI_ADVISOR_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm active:scale-[0.99] transition-transform card-hover"
    >
      <div className="w-9 h-9 rounded-xl bg-trenord-green/10 dark:bg-trenord-green/20 flex items-center justify-center flex-shrink-0">
        <TrainFront className="w-4.5 h-4.5 text-trenord-green-dark dark:text-trenord-green-light" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          Cerchi sale relax o servizi in stazione?
        </p>
        <p className="text-[11px] text-gray-400">Scopri Supremi Advisor</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
    </a>
  );
}
