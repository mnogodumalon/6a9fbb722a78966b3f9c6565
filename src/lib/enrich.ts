import type { EnrichedArtikel, EnrichedAuftraege, EnrichedAuftragspositionen, EnrichedBestellpositionen, EnrichedLagerbewegungen, EnrichedLieferantenbestellungen, EnrichedRechnungen, EnrichedZahlungseingaenge } from '@/types/enriched';
import type { Artikel, Auftraege, Auftragspositionen, Bestellpositionen, Kunden, Lagerbewegungen, Lieferanten, Lieferantenbestellungen, Rechnungen, Zahlungseingaenge } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface ArtikelMaps {
  lieferantenMap: Map<string, Lieferanten>;
}

export function enrichArtikel(
  artikel: Artikel[],
  maps: ArtikelMaps
): EnrichedArtikel[] {
  return artikel.map(r => ({
    ...r,
    lieferantName: resolveDisplay(r.fields.lieferant, maps.lieferantenMap, 'firmenname'),
  }));
}

interface AuftraegeMaps {
  kundenMap: Map<string, Kunden>;
}

export function enrichAuftraege(
  auftraege: Auftraege[],
  maps: AuftraegeMaps
): EnrichedAuftraege[] {
  return auftraege.map(r => ({
    ...r,
    kundeName: resolveDisplay(r.fields.kunde, maps.kundenMap, 'firmenname'),
  }));
}

interface AuftragspositionenMaps {
  auftraegeMap: Map<string, Auftraege>;
  artikelMap: Map<string, Artikel>;
}

export function enrichAuftragspositionen(
  auftragspositionen: Auftragspositionen[],
  maps: AuftragspositionenMaps
): EnrichedAuftragspositionen[] {
  return auftragspositionen.map(r => ({
    ...r,
    auftragName: resolveDisplay(r.fields.auftrag, maps.auftraegeMap, 'auftragsnummer'),
    artikelName: resolveDisplay(r.fields.artikel, maps.artikelMap, 'artikelnummer'),
  }));
}

interface LieferantenbestellungenMaps {
  lieferantenMap: Map<string, Lieferanten>;
}

export function enrichLieferantenbestellungen(
  lieferantenbestellungen: Lieferantenbestellungen[],
  maps: LieferantenbestellungenMaps
): EnrichedLieferantenbestellungen[] {
  return lieferantenbestellungen.map(r => ({
    ...r,
    lieferantName: resolveDisplay(r.fields.lieferant, maps.lieferantenMap, 'firmenname'),
  }));
}

interface BestellpositionenMaps {
  lieferantenbestellungenMap: Map<string, Lieferantenbestellungen>;
  artikelMap: Map<string, Artikel>;
}

export function enrichBestellpositionen(
  bestellpositionen: Bestellpositionen[],
  maps: BestellpositionenMaps
): EnrichedBestellpositionen[] {
  return bestellpositionen.map(r => ({
    ...r,
    bestellungName: resolveDisplay(r.fields.bestellung, maps.lieferantenbestellungenMap, 'bestellnummer'),
    artikelName: resolveDisplay(r.fields.artikel, maps.artikelMap, 'artikelnummer'),
  }));
}

interface LagerbewegungenMaps {
  artikelMap: Map<string, Artikel>;
  auftraegeMap: Map<string, Auftraege>;
  lieferantenbestellungenMap: Map<string, Lieferantenbestellungen>;
}

export function enrichLagerbewegungen(
  lagerbewegungen: Lagerbewegungen[],
  maps: LagerbewegungenMaps
): EnrichedLagerbewegungen[] {
  return lagerbewegungen.map(r => ({
    ...r,
    artikelName: resolveDisplay(r.fields.artikel, maps.artikelMap, 'artikelnummer'),
    auftragName: resolveDisplay(r.fields.auftrag, maps.auftraegeMap, 'auftragsnummer'),
    bestellungName: resolveDisplay(r.fields.bestellung, maps.lieferantenbestellungenMap, 'bestellnummer'),
  }));
}

interface RechnungenMaps {
  auftraegeMap: Map<string, Auftraege>;
}

export function enrichRechnungen(
  rechnungen: Rechnungen[],
  maps: RechnungenMaps
): EnrichedRechnungen[] {
  return rechnungen.map(r => ({
    ...r,
    auftragName: resolveDisplay(r.fields.auftrag, maps.auftraegeMap, 'auftragsnummer'),
  }));
}

interface ZahlungseingaengeMaps {
  rechnungenMap: Map<string, Rechnungen>;
}

export function enrichZahlungseingaenge(
  zahlungseingaenge: Zahlungseingaenge[],
  maps: ZahlungseingaengeMaps
): EnrichedZahlungseingaenge[] {
  return zahlungseingaenge.map(r => ({
    ...r,
    rechnungName: resolveDisplay(r.fields.rechnung, maps.rechnungenMap, 'rechnungsnummer'),
  }));
}
