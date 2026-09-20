# Navetta Trenord — React/TS/Vite/Tailwind/Supabase

Migrazione dal vecchio `index.html` vanilla-JS allo stesso stack di Supremi
Advisor, con la stessa identità visiva (verde Trenord `#007A3D`, Inter,
card `rounded-2xl`, dark mode).

## Prima di avviare il progetto

1. **Icone PWA**: copia in `public/` gli stessi file icona già in uso sul
   deploy Netlify attuale (`favicon-32x32.png`, `apple-touch-icon.png`,
   `android-chrome-192x192.png`, `android-chrome-512x512.png`). Non li ho
   potuti copiare qui perché non erano nel materiale che mi hai passato.
2. **Credenziali Supabase**: apri `src/lib/supabase.ts` e sostituisci
   `INCOLLA_QUI_PROJECT_URL` / `INCOLLA_QUI_ANON_KEY` con i valori del
   progetto Supabase di Navetta Trenord (Project Settings → API). È un
   progetto Supabase diverso da quello di Supremi Advisor.
3. **Schema Supabase**: se non l'hai già fatto, esegui nell'ordine
   `schema.sql` → `seed_data.sql` → `schema_patch_a_richiesta.sql` (i file
   che ti ho generato prima) sul progetto Supabase di Navetta.

## Sviluppo locale

```bash
npm install
npm run dev
```

## Build di produzione

```bash
npm run build   # output in dist/
npm run preview # per testare la build in locale prima del deploy
```

## Deploy

Netlify: build command `npx vite build`, publish directory `dist`
(già configurato in `netlify.toml`, identico a quello di Supremi Advisor).

**Prima di sovrascrivere il deploy in produzione**, testa con `npm run
preview` o con un deploy preview Netlify che "prossime corse" mostri gli
stessi orari della versione attuale — i dipendenti la usano ogni giorno.

## Cosa manca ancora (prossime fasi)

- Admin panel per modificare gli orari senza toccare SQL a mano
  (riprenderà il pattern `admin-api.ts` + PIN di Supremi Advisor)
- Modulo segnalazioni utenti
- Cross-promo verso Supremi Advisor
- Il pulsante Admin nella `NavBar` è già predisposto (prop `onAdminAccess`)
  ma non ancora collegato — arriva con l'admin panel

## Struttura

```
src/
  lib/         supabase.ts, time.ts (helper orari/periodicità)
  hooks/       useOrari (fetch + auto-refresh 60s), useFavorites, useTheme
  components/  NavBar, RouteFilterPanel, FavoritesList, CorsaCard, EmptyState, LoadingSpinner
  screens/     HomeScreen (l'unica per ora)
  types.ts     Fermata, Corsa, Direzione, Favorita
```
