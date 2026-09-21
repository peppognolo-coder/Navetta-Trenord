// =============================================================
// adminApi.ts
// Client frontend per /.netlify/functions/admin-api e verify-admin-pin.
// Non parla mai direttamente con Supabase per le scritture — tutto passa
// dal server con SUPABASE_SERVICE_ROLE_KEY. Stesso pattern di Supremi
// Advisor (src/lib/adminApi.ts).
// =============================================================

export interface AdminApiError {
  code: string;
  message: string;
}

export interface AdminApiResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: AdminApiError;
}

// -------------------------------------------------------------
// Tipi delle righe restituite da getOrari (vista "admin", include
// anche le righe disattivate, a differenza della query pubblica).
// -------------------------------------------------------------

export interface AdminFermata {
  id: string;
  codice: string;
  nome: string;
  ordine_default: number;
  a_richiesta: boolean;
  attiva: boolean;
}

export interface AdminTipoServizio {
  id: string;
  codice: string;
  nome: string;
  giorni_settimana: number[];
}

export interface AdminCorsaFermata {
  id: string;
  orario: string; // 'HH:MM:SS'
  ordine: number;
  fermata_id: string;
}

export interface AdminCorsa {
  id: string;
  codice: string;
  direzione: 'A' | 'B';
  attiva: boolean;
  note: string | null;
  tipo_servizio_id: string;
  corse_fermate: AdminCorsaFermata[];
}

export interface AdminFestivita {
  data: string; // 'YYYY-MM-DD'
  descrizione: string | null;
}

export interface AdminOrariData {
  fermate: AdminFermata[];
  tipiServizio: AdminTipoServizio[];
  corse: AdminCorsa[];
  festivita: AdminFestivita[];
}

export interface StopInput {
  fermataId: string;
  orario: string; // 'HH:MM'
  ordine: number;
}

// -------------------------------------------------------------
// helper interno
// -------------------------------------------------------------

const FUNCTION_URL = '/.netlify/functions/admin-api';
const VERIFY_URL = '/.netlify/functions/verify-admin-pin';

async function call<T>(
  action: string,
  adminPin: string,
  payload?: Record<string, unknown>
): Promise<AdminApiResult<T>> {
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminPin, payload }),
    });
    return (await res.json()) as AdminApiResult<T>;
  } catch {
    return { ok: false, error: { code: 'NETWORK_ERROR', message: 'Errore di rete. Verifica la connessione.' } };
  }
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = (await res.json()) as { ok: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// ORARI (fermate / corse / tipi_servizio / festivita)
// -------------------------------------------------------------

export async function getOrari(adminPin: string): Promise<AdminApiResult<AdminOrariData>> {
  return call<AdminOrariData>('getOrari', adminPin);
}

export async function updateCorsaStops(
  adminPin: string,
  corsaId: string,
  stops: StopInput[]
): Promise<AdminApiResult<{ updated: string }>> {
  return call<{ updated: string }>('updateCorsaStops', adminPin, { corsaId, stops });
}

export async function toggleAttivaCorsa(
  adminPin: string,
  id: string,
  attiva: boolean
): Promise<AdminApiResult<AdminCorsa>> {
  return call<AdminCorsa>('toggleAttivaCorsa', adminPin, { id, attiva });
}

export async function updateCorsaInfo(
  adminPin: string,
  payload: { id: string; codice?: string; direzione?: 'A' | 'B'; tipoServizioId?: string; note?: string | null }
): Promise<AdminApiResult<AdminCorsa>> {
  return call<AdminCorsa>('updateCorsaInfo', adminPin, payload as unknown as Record<string, unknown>);
}

export async function addCorsa(
  adminPin: string,
  payload: {
    codice: string;
    direzione: 'A' | 'B';
    tipoServizioId: string;
    stops: StopInput[];
    note?: string | null;
  }
): Promise<AdminApiResult<AdminCorsa>> {
  return call<AdminCorsa>('addCorsa', adminPin, payload as unknown as Record<string, unknown>);
}

export async function deleteCorsa(adminPin: string, id: string): Promise<AdminApiResult<{ deleted: string }>> {
  return call<{ deleted: string }>('deleteCorsa', adminPin, { id });
}

export async function addFestivita(
  adminPin: string,
  data: string,
  descrizione?: string | null
): Promise<AdminApiResult<AdminFestivita>> {
  return call<AdminFestivita>('addFestivita', adminPin, { data, descrizione });
}

export async function deleteFestivita(adminPin: string, data: string): Promise<AdminApiResult<{ deleted: string }>> {
  return call<{ deleted: string }>('deleteFestivita', adminPin, { data });
}

export async function toggleAttivaFermata(
  adminPin: string,
  id: string,
  attiva: boolean
): Promise<AdminApiResult<AdminFermata>> {
  return call<AdminFermata>('toggleAttivaFermata', adminPin, { id, attiva });
}
