import { createClient } from '@supabase/supabase-js';

// Progetto Supabase DEDICATO a Navetta Trenord — non lo stesso di Supremi
// Advisor. Stesso pattern (chiave anon direttamente nel codice: è pensata
// per stare nel bundle pubblico, protetta dalla RLS, non è un segreto).
const supabaseUrl = 'INCOLLA_QUI_PROJECT_URL';
const supabaseAnonKey = 'INCOLLA_QUI_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
