import { useEffect, useMemo, useState } from 'react';
import {
  Bus,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Power,
  Loader2,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import {
  getOrari,
  toggleAttivaCorsa,
  updateCorsaInfo,
  updateCorsaStops,
  addCorsa,
  deleteCorsa,
  addFestivita,
  deleteFestivita,
  type AdminOrariData,
  type AdminCorsa,
  type StopInput,
} from '../lib/adminApi';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { Direzione } from '../types';

interface Props {
  adminPin: string;
  onBack: () => void;
  onLogout: () => void;
}

type Tab = 'corse' | 'festivita';

// Stato del form di modifica/creazione corsa
interface CorsaFormState {
  id: string | null; // null = nuova corsa
  codice: string;
  direzione: Direzione;
  tipoServizioId: string;
  note: string;
  orari: Record<string, string>; // fermataId -> 'HH:MM' (vuoto = non toccata da questa corsa)
}

function emptyForm(direzione: Direzione, tipoServizioId: string): CorsaFormState {
  return { id: null, codice: '', direzione, tipoServizioId, note: '', orari: {} };
}

export default function AdminScreen({ adminPin, onBack, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('corse');
  const [data, setData] = useState<AdminOrariData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [direzioneFiltro, setDirezioneFiltro] = useState<Direzione>('A');
  const [form, setForm] = useState<CorsaFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [nuovaData, setNuovaData] = useState('');
  const [nuovaDescr, setNuovaDescr] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    const res = await getOrari(adminPin);
    if (!res.ok || !res.data) {
      setError(res.error?.message ?? 'Errore nel caricamento dei dati.');
      setLoading(false);
      return;
    }
    setData(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const fermateOrdinate = useMemo(
    () => [...(data?.fermate ?? [])].sort((a, b) => a.ordine_default - b.ordine_default),
    [data]
  );

  const corseFiltrate = useMemo(
    () =>
      [...(data?.corse ?? [])]
        .filter((c) => c.direzione === direzioneFiltro)
        .sort((a, b) => a.codice.localeCompare(b.codice, 'it', { numeric: true })),
    [data, direzioneFiltro]
  );

  function tipoServizioLabel(id: string): string {
    return data?.tipiServizio.find((t) => t.id === id)?.codice ?? '?';
  }

  function openEdit(corsa: AdminCorsa) {
    const orari: Record<string, string> = {};
    for (const cf of corsa.corse_fermate) {
      orari[cf.fermata_id] = cf.orario.slice(0, 5);
    }
    setForm({
      id: corsa.id,
      codice: corsa.codice,
      direzione: corsa.direzione,
      tipoServizioId: corsa.tipo_servizio_id,
      note: corsa.note ?? '',
      orari,
    });
    setFormError(null);
  }

  function openNew() {
    const defaultTipo = data?.tipiServizio[0]?.id ?? '';
    setForm(emptyForm(direzioneFiltro, defaultTipo));
    setFormError(null);
  }

  function setOrario(fermataId: string, value: string) {
    setForm((f) => (f ? { ...f, orari: { ...f.orari, [fermataId]: value } } : f));
  }

  async function handleSaveForm() {
    if (!form) return;
    if (!form.codice.trim()) {
      setFormError('Il codice corsa è obbligatorio.');
      return;
    }
    if (!form.tipoServizioId) {
      setFormError('Seleziona una periodicità.');
      return;
    }
    const stops: StopInput[] = fermateOrdinate
      .filter((f) => form.orari[f.id]?.trim())
      .map((f, i) => ({ fermataId: f.id, orario: form.orari[f.id], ordine: i + 1 }));
    if (stops.length === 0) {
      setFormError('Imposta almeno un orario di fermata.');
      return;
    }

    setSaving(true);
    setFormError(null);

    if (form.id) {
      const infoRes = await updateCorsaInfo(adminPin, {
        id: form.id,
        codice: form.codice.trim(),
        direzione: form.direzione,
        tipoServizioId: form.tipoServizioId,
        note: form.note.trim() || null,
      });
      if (!infoRes.ok) {
        setSaving(false);
        setFormError(infoRes.error?.message ?? 'Errore nel salvataggio.');
        return;
      }
      const stopsRes = await updateCorsaStops(adminPin, form.id, stops);
      setSaving(false);
      if (!stopsRes.ok) {
        setFormError(stopsRes.error?.message ?? 'Errore nel salvataggio degli orari.');
        return;
      }
      flash('Corsa aggiornata');
    } else {
      const res = await addCorsa(adminPin, {
        codice: form.codice.trim(),
        direzione: form.direzione,
        tipoServizioId: form.tipoServizioId,
        note: form.note.trim() || null,
        stops,
      });
      setSaving(false);
      if (!res.ok) {
        setFormError(res.error?.message ?? 'Errore nella creazione della corsa.');
        return;
      }
      flash('Corsa creata');
    }

    setForm(null);
    load();
  }

  async function handleToggleAttiva(corsa: AdminCorsa) {
    const res = await toggleAttivaCorsa(adminPin, corsa.id, !corsa.attiva);
    if (!res.ok) {
      flash(res.error?.message ?? 'Errore');
      return;
    }
    flash(corsa.attiva ? 'Corsa disattivata' : 'Corsa riattivata');
    load();
  }

  async function handleDeleteCorsa(corsa: AdminCorsa) {
    if (!confirm(`Eliminare definitivamente la corsa ${corsa.codice}? L'operazione non è reversibile.`)) return;
    const res = await deleteCorsa(adminPin, corsa.id);
    if (!res.ok) {
      flash(res.error?.message ?? 'Errore');
      return;
    }
    flash('Corsa eliminata');
    load();
  }

  async function handleAddFestivita() {
    if (!nuovaData) return;
    const res = await addFestivita(adminPin, nuovaData, nuovaDescr.trim() || null);
    if (!res.ok) {
      flash(res.error?.message ?? 'Errore');
      return;
    }
    setNuovaData('');
    setNuovaDescr('');
    flash('Festività aggiunta');
    load();
  }

  async function handleDeleteFestivita(dataIso: string) {
    if (!confirm('Rimuovere questa data dal calendario festività?')) return;
    const res = await deleteFestivita(adminPin, dataIso);
    if (!res.ok) {
      flash(res.error?.message ?? 'Errore');
      return;
    }
    flash('Festività rimossa');
    load();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-[72px] pb-10 flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna all'app
        </button>
        {toast && (
          <span className="text-xs font-medium text-trenord-green-dark dark:text-trenord-green-light animate-fade-in">
            ✓ {toast}
          </span>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Esci
        </button>
      </div>

      <div className="flex gap-2 bg-white dark:bg-gray-900 rounded-2xl p-1 border border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setTab('corse')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'corse'
              ? 'bg-trenord-green text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Bus className="w-4 h-4" />
          Corse
        </button>
        <button
          onClick={() => setTab('festivita')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === 'festivita'
              ? 'bg-trenord-green text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Festività
        </button>
      </div>

      {loading && <LoadingSpinner message="Caricamento dati admin..." />}
      {error && <EmptyState icon={Bus} title="Errore" description={error} />}

      {!loading && !error && data && tab === 'corse' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['A', 'B'] as Direzione[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirezioneFiltro(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    direzioneFiltro === d
                      ? 'bg-trenord-green text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                  }`}
                >
                  Direzione {d}
                </button>
              ))}
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 bg-trenord-green text-white rounded-xl px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Nuova corsa
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {corseFiltrate.length === 0 && (
              <EmptyState icon={Bus} title="Nessuna corsa" description="Nessuna corsa in questa direzione." />
            )}
            {corseFiltrate.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 bg-white dark:bg-gray-900 border rounded-2xl px-4 py-3 ${
                  c.attiva ? 'border-gray-100 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800 opacity-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{c.codice}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-trenord-green/10 text-trenord-green-dark dark:text-trenord-green-light">
                      {tipoServizioLabel(c.tipo_servizio_id)}
                    </span>
                    {!c.attiva && <span className="text-[10px] text-gray-400">disattivata</span>}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{c.corse_fermate.length} fermate</p>
                </div>
                <button
                  onClick={() => handleToggleAttiva(c)}
                  title={c.attiva ? 'Disattiva' : 'Riattiva'}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center flex-shrink-0"
                >
                  <Power className={`w-4 h-4 ${c.attiva ? 'text-trenord-green' : 'text-gray-300'}`} />
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center flex-shrink-0"
                >
                  <Pencil className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => handleDeleteCorsa(c)}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && data && tab === 'festivita' && (
        <>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
            <span className="section-title">Aggiungi festività</span>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={nuovaData}
                onChange={(e) => setNuovaData(e.target.value)}
                className="admin-input flex-1 min-w-[150px]"
              />
              <input
                type="text"
                placeholder="Descrizione (opzionale)"
                value={nuovaDescr}
                onChange={(e) => setNuovaDescr(e.target.value)}
                className="admin-input flex-1 min-w-[150px]"
              />
              <button
                onClick={handleAddFestivita}
                disabled={!nuovaData}
                className="flex-shrink-0 bg-trenord-green text-white rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Aggiungi
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {data.festivita.length === 0 && (
              <EmptyState icon={CalendarDays} title="Nessuna festività" description="Il calendario festività è vuoto." />
            )}
            {data.festivita.map((f) => (
              <div
                key={f.data}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                    {new Date(f.data + 'T00:00:00').toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {f.descrizione && <p className="text-[11px] text-gray-400 mt-0.5">{f.descrizione}</p>}
                </div>
                <button
                  onClick={() => handleDeleteFestivita(f.data)}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {form && data && (
        <div className="fixed inset-0 z-[998] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {form.id ? `Modifica corsa ${form.codice}` : 'Nuova corsa'}
              </h2>
              <button
                onClick={() => setForm(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Codice corsa</label>
                <input
                  value={form.codice}
                  onChange={(e) => setForm({ ...form, codice: e.target.value })}
                  className="admin-input"
                  placeholder="es. 176"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Direzione</label>
                <select
                  value={form.direzione}
                  onChange={(e) => setForm({ ...form, direzione: e.target.value as Direzione })}
                  className="admin-input"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Periodicità</label>
              <select
                value={form.tipoServizioId}
                onChange={(e) => setForm({ ...form, tipoServizioId: e.target.value })}
                className="admin-input"
              >
                {data.tipiServizio.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.codice})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Note (opzionale)</label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="admin-input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="section-title">Orari per fermata</span>
              <p className="text-[11px] text-gray-400 -mt-1">
                Lascia vuoto per le fermate non toccate da questa corsa.
              </p>
              <div className="flex flex-col gap-1.5">
                {fermateOrdinate.map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300 flex-1 min-w-0 truncate">
                      {f.nome}
                      {f.a_richiesta && <span className="text-[10px] text-gray-400 ml-1">(a richiesta)</span>}
                    </span>
                    <input
                      type="time"
                      value={form.orari[f.id] ?? ''}
                      onChange={(e) => setOrario(f.id, e.target.value)}
                      className="admin-input w-[120px] flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex gap-2 sticky bottom-0 bg-white dark:bg-gray-900 pt-2">
              <button
                onClick={() => setForm(null)}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl py-3 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveForm}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-trenord-green text-white rounded-2xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
