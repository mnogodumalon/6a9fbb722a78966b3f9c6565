/**
 * Occupancy semantics — DECIDED BY THE BUILD AGENT, never by a heuristic.
 *
 * The Phase-2 orchestrator writes its decision to `.intents-staging/occupancy.json`
 * (stay pair, booked resource, statuses that do not occupy); the integration
 * step validates it against the app metadata and renders it into the block
 * below. Scaffold updates keep the block. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - lieferanten: no date pair, no references
 *   - kunden: no date pair, no references
 *   - artikel: applookups lieferant→lieferanten · lookups mehrwertsteuersatz[mwst_7|mwst_19]
 *   - auftraege: applookups kunde→kunden · lookups status[entwurf|freigegeben|geliefert|abgerechnet|storniert]
 *   - auftragspositionen: applookups auftrag→auftraege, artikel→artikel · lookups mehrwertsteuersatz[mwst_7|mwst_19]
 *   - lieferantenbestellungen: applookups lieferant→lieferanten · lookups status[offen|bestellt|eingegangen]
 *   - bestellpositionen: applookups bestellung→lieferantenbestellungen, artikel→artikel
 *   - lagerbewegungen: applookups artikel→artikel, auftrag→auftraege, bestellung→lieferantenbestellungen · lookups bewegungstyp[wareneingang|warenausgang|korrektur]
 *   - rechnungen: applookups auftrag→auftraege · lookups status[offen|bezahlt|ueberfaellig]
 *   - zahlungseingaenge: applookups rechnung→rechnungen · lookups zahlungsart[lastschrift|bar|sonstige|ueberweisung]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};
