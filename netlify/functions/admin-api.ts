/**
 * admin-api
 *
 * Unico endpoint per tutte le scritture admin su Navetta Trenord. Stesso
 * pattern di Supremi Advisor (netlify/functions/admin-api.ts): il client
 * non parla mai direttamente con Supabase per queste operazioni, passa
 * sempre da qui con la service_role key, e il PIN viene riverificato ad
 * OGNI chiamata (non solo al login) tramite verify_admin_pin.
 *
 * POST body: { action: Action, payload?: object, adminPin: string }
 * Response:  { ok: boolean, data?: unknown, error?: { code, message } }
 */

import { createClient } from '@supabase/supabase-js';
import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { checkAdminPin } from './_shared/verifyAdminPin';

type Action =
  | 'getOrari'
  | 'updateCorsaStops'
  | 'toggleAttivaCorsa'
  | 'updateCorsaInfo'
  | 'addCorsa'
  | 'deleteCorsa'
  | 'addFestivita'
  | 'deleteFestivita'
  | 'toggleAttivaFermata';

interface RequestBody {
  action: Action;
  payload?: Record<string, unknown>;
  adminPin: string;
}

interface AdminApiError {
  code: string;
  message: string;
}

interface AdminApiResponse {
  ok: boolean;
  data?: unknown;
  error?: AdminApiError;
}

const ERRORS: Record<string, AdminApiError> = {
  MISSING_PIN: { code: 'MISSING_PIN', message: 'PIN admin mancante.' },
  INVALID_PIN: { code: 'INVALID_PIN', message: 'PIN admin non valido.' },
  MISSING_ACTION: { code: 'MISSING_ACTION', message: 'Azione non specificata.' },
  UNKNOWN_ACTION: { code: 'UNKNOWN_ACTION', message: 'Azione non riconosciuta.' },
  MISSING_PAYLOAD: { code: 'MISSING_PAYLOAD', message: 'Payload mancante o incompleto.' },
  DB_ERROR: { code: 'DB_ERROR', message: 'Errore database.' },
  SERVER_ERROR: { code: 'SERVER_ERROR', message: 'Errore interno del server.' },
  METHOD_NOT_ALLOWED: { code: 'METHOD_NOT_ALLOWED', message: 'Metodo HTTP non supportato.' },
};

function ok(data: unknown): HandlerResponse {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, data } satisfies AdminApiResponse),
  };
}

function err(error: AdminApiError, status = 400): HandlerResponse {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: false, error } satisfies AdminApiResponse),
  };
}

function dbErr(detail: string): HandlerResponse {
  return err({ ...ERRORS.DB_ERROR, message: `Errore database: ${detail}` }, 500);
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return err(ERRORS.METHOD_NOT_ALLOWED, 405);
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return err(ERRORS.SERVER_ERROR, 400);
  }

  const { action, payload, adminPin } = body;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('[admin-api] Variabili env mancanti (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    return err(ERRORS.SERVER_ERROR, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // PIN riverificato ad ogni chiamata, non solo al login.
  if (!adminPin) return err(ERRORS.MISSING_PIN, 401);
  const pinValido = await checkAdminPin(supabase, adminPin);
  if (!pinValido) return err(ERRORS.INVALID_PIN, 401);

  if (!action) return err(ERRORS.MISSING_ACTION, 400);

  try {
    // ============================================================
    // GET ORARI — tutto in un colpo solo, INCLUSE le corse disattivate
    // (che la query pubblica di useOrari filtra invece con .eq('attiva', true))
    // ============================================================
    if (action === 'getOrari') {
      const { data: fermate, error: errF } = await supabase
        .from('fermate')
        .select('id, codice, nome, ordine_default, a_richiesta, attiva')
        .order('ordine_default');
      if (errF) return dbErr(errF.message);

      const { data: tipiServizio, error: errT } = await supabase
        .from('tipi_servizio')
        .select('id, codice, nome, giorni_settimana');
      if (errT) return dbErr(errT.message);

      const { data: corse, error: errC } = await supabase
        .from('corse')
        .select(
          `id, codice, direzione, attiva, note, tipo_servizio_id,
           corse_fermate ( id, orario, ordine, fermata_id )`
        )
        .order('codice');
      if (errC) return dbErr(errC.message);

      const { data: festivita, error: errFe } = await supabase
        .from('festivita')
        .select('data, descrizione')
        .order('data');
      if (errFe) return dbErr(errFe.message);

      return ok({ fermate, tipiServizio, corse, festivita });
    }

    // ============================================================
    // UPDATE CORSA STOPS — sovrascrive gli orari di una corsa esistente
    // payload: { corsaId, stops: [{ id?, fermataId, orario, ordine }] }
    // Le righe corse_fermate esistenti vengono sostituite (delete + insert)
    // così una modifica può anche cambiare quali fermate tocca la corsa.
    // ============================================================
    if (action === 'updateCorsaStops') {
      const { corsaId, stops } = (payload ?? {}) as {
        corsaId?: string;
        stops?: { fermataId: string; orario: string; ordine: number }[];
      };
      if (!corsaId) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: corsaId' });
      if (!Array.isArray(stops) || stops.length === 0) {
        return err({ ...ERRORS.MISSING_PAYLOAD, message: 'La corsa deve avere almeno una fermata' });
      }

      const { error: delErr } = await supabase.from('corse_fermate').delete().eq('corsa_id', corsaId);
      if (delErr) return dbErr(delErr.message);

      const rows = stops.map((s) => ({
        corsa_id: corsaId,
        fermata_id: s.fermataId,
        orario: s.orario,
        ordine: s.ordine,
      }));
      const { error: insErr } = await supabase.from('corse_fermate').insert(rows);
      if (insErr) return dbErr(insErr.message);

      return ok({ updated: corsaId });
    }

    // ============================================================
    // TOGGLE ATTIVA CORSA — sospende/riattiva una corsa senza cancellarla
    // ============================================================
    if (action === 'toggleAttivaCorsa') {
      const { id, attiva } = (payload ?? {}) as { id?: string; attiva?: boolean };
      if (!id) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: id' });
      const { data, error } = await supabase
        .from('corse')
        .update({ attiva: attiva ?? true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return dbErr(error.message);
      return ok(data);
    }

    // ============================================================
    // UPDATE CORSA INFO — cambia codice/direzione/periodicità/note
    // ============================================================
    if (action === 'updateCorsaInfo') {
      const { id, codice, direzione, tipoServizioId, note } = (payload ?? {}) as {
        id?: string; codice?: string; direzione?: string; tipoServizioId?: string; note?: string | null;
      };
      if (!id) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: id' });
      const { data, error } = await supabase
        .from('corse')
        .update({
          ...(codice ? { codice } : {}),
          ...(direzione ? { direzione } : {}),
          ...(tipoServizioId ? { tipo_servizio_id: tipoServizioId } : {}),
          note: note ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) return dbErr(error.message);
      return ok(data);
    }

    // ============================================================
    // ADD CORSA — crea una nuova corsa con le sue fermate
    // payload: { codice, direzione, tipoServizioId, stops: [{fermataId, orario, ordine}] }
    // ============================================================
    if (action === 'addCorsa') {
      const { codice, direzione, tipoServizioId, stops, note } = (payload ?? {}) as {
        codice?: string; direzione?: string; tipoServizioId?: string; note?: string | null;
        stops?: { fermataId: string; orario: string; ordine: number }[];
      };
      if (!codice) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: codice' });
      if (!direzione) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: direzione' });
      if (!tipoServizioId) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: tipoServizioId' });
      if (!Array.isArray(stops) || stops.length === 0) {
        return err({ ...ERRORS.MISSING_PAYLOAD, message: 'La corsa deve avere almeno una fermata' });
      }

      const { data: corsa, error: insCorsaErr } = await supabase
        .from('corse')
        .insert({ codice, direzione, tipo_servizio_id: tipoServizioId, note: note ?? null })
        .select()
        .single();
      if (insCorsaErr) return dbErr(insCorsaErr.message);

      const rows = stops.map((s) => ({
        corsa_id: corsa.id,
        fermata_id: s.fermataId,
        orario: s.orario,
        ordine: s.ordine,
      }));
      const { error: insStopsErr } = await supabase.from('corse_fermate').insert(rows);
      if (insStopsErr) {
        // rollback manuale: se le fermate falliscono, non lasciamo una corsa orfana senza stop
        await supabase.from('corse').delete().eq('id', corsa.id);
        return dbErr(insStopsErr.message);
      }

      return ok(corsa);
    }

    // ============================================================
    // DELETE CORSA — cancellazione definitiva (corse_fermate a cascata via FK)
    // ============================================================
    if (action === 'deleteCorsa') {
      const { id } = (payload ?? {}) as { id?: string };
      if (!id) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: id' });
      const { error } = await supabase.from('corse').delete().eq('id', id);
      if (error) return dbErr(error.message);
      return ok({ deleted: id });
    }

    // ============================================================
    // FESTIVITÀ
    // ============================================================
    if (action === 'addFestivita') {
      const { data: dataFestivo, descrizione } = (payload ?? {}) as { data?: string; descrizione?: string | null };
      if (!dataFestivo) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: data' });
      const { data, error } = await supabase
        .from('festivita')
        .upsert({ data: dataFestivo, descrizione: descrizione ?? null })
        .select()
        .single();
      if (error) return dbErr(error.message);
      return ok(data);
    }

    if (action === 'deleteFestivita') {
      const { data: dataFestivo } = (payload ?? {}) as { data?: string };
      if (!dataFestivo) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: data' });
      const { error } = await supabase.from('festivita').delete().eq('data', dataFestivo);
      if (error) return dbErr(error.message);
      return ok({ deleted: dataFestivo });
    }

    // ============================================================
    // TOGGLE ATTIVA FERMATA
    // ============================================================
    if (action === 'toggleAttivaFermata') {
      const { id, attiva } = (payload ?? {}) as { id?: string; attiva?: boolean };
      if (!id) return err({ ...ERRORS.MISSING_PAYLOAD, message: 'Campo obbligatorio: id' });
      const { data, error } = await supabase
        .from('fermate')
        .update({ attiva: attiva ?? true })
        .eq('id', id)
        .select()
        .single();
      if (error) return dbErr(error.message);
      return ok(data);
    }

    return err(ERRORS.UNKNOWN_ACTION, 400);
  } catch (e) {
    console.error('[admin-api] Errore inatteso:', e);
    return err(ERRORS.SERVER_ERROR, 500);
  }
};
