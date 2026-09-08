import type { Artikel, Auftraege, Auftragspositionen, Bestellpositionen, Lagerbewegungen, Lieferantenbestellungen, Rechnungen, Zahlungseingaenge } from './app';

export type EnrichedArtikel = Artikel & {
  lieferantName: string;
};

export type EnrichedAuftraege = Auftraege & {
  kundeName: string;
};

export type EnrichedAuftragspositionen = Auftragspositionen & {
  auftragName: string;
  artikelName: string;
};

export type EnrichedLieferantenbestellungen = Lieferantenbestellungen & {
  lieferantName: string;
};

export type EnrichedBestellpositionen = Bestellpositionen & {
  bestellungName: string;
  artikelName: string;
};

export type EnrichedLagerbewegungen = Lagerbewegungen & {
  artikelName: string;
  auftragName: string;
  bestellungName: string;
};

export type EnrichedRechnungen = Rechnungen & {
  auftragName: string;
};

export type EnrichedZahlungseingaenge = Zahlungseingaenge & {
  rechnungName: string;
};
