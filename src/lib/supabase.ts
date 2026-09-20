import { createClient } from '@supabase/supabase-js';

// Progetto Supabase DEDICATO a Navetta Trenord — non lo stesso di Supremi
// Advisor. Stesso pattern (chiave anon direttamente nel codice: è pensata
// per stare nel bundle pubblico, protetta dalla RLS, non è un segreto).
const supabaseUrl = 'https://itfnzrnrcogebvzuwmts.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Zm56cm5yY29nZWJ2enV3bXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjAzODYsImV4cCI6MjEwNTQ5NjM4Nn0.7hdXBBdAJTElx4rKL4U4j4fW3xRLv0yrkROipAAa2Es';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
