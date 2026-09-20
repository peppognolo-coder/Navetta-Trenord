export type Direzione = 'A' | 'B';
export type TipoServizioCodice = 'G' | 'FS' | 'F' | 'FE';

export interface Fermata {
  id: string; // codice, es. 'greco'
  nome: string;
  indirizzo?: string;
  aRichiesta: boolean;
}

export interface CorsaStop {
  fermataId: string;
  orario: string; // 'HH:MM'
}

export interface Corsa {
  id: string; // codice corsa, es. '176', 'N1', '14a'
  periodicita: TipoServizioCodice;
  direzione: Direzione;
  stops: CorsaStop[];
}

export interface Favorita {
  origine: string | null;
  destinazione: string | null;
  direzione: Direzione;
}
