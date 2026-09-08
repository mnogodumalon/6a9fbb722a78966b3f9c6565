/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - lieferanten: firmenname (Firmenname)
 *   - kunden: firmenname (Firmenname)
 *   - artikel: artikelnummer (Artikelnummer), bezeichnung (Bezeichnung), mehrwertsteuersatz (Mehrwertsteuersatz)
 *   - auftraege: auftragsnummer (Auftragsnummer), auftragsdatum (Auftragsdatum), kunde (Kunde), status (Status)
 *   - auftragspositionen: auftrag (Auftrag), artikel (Artikel), menge (Menge)
 *   - lieferantenbestellungen: bestellnummer (Bestellnummer), bestelldatum (Bestelldatum), lieferant (Lieferant), status (Status)
 *   - bestellpositionen: bestellung (Bestellung), artikel (Artikel), menge (Menge)
 *   - lagerbewegungen: bewegungstyp (Bewegungstyp), artikel (Artikel), menge (Menge), datum (Datum)
 *   - rechnungen: rechnungsnummer (Rechnungsnummer), rechnungsdatum (Rechnungsdatum), faelligkeitsdatum (Fälligkeitsdatum), auftrag (Auftrag), status (Status)
 *   - zahlungseingaenge: rechnung (Rechnung), zahlungsbetrag (Zahlungsbetrag (€)), zahlungsdatum (Zahlungsdatum)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "lieferanten": "firmenname" | "ansprechpartner_vorname" | "ansprechpartner_nachname" | "strasse" | "hausnummer" | "plz" | "ort" | "email" | "telefon" | "website" | "bemerkung";
  "kunden": "firmenname" | "ansprechpartner_vorname" | "ansprechpartner_nachname" | "strasse" | "hausnummer" | "plz" | "ort" | "email" | "telefon" | "zahlungsziel_tage" | "kreditlimit" | "bemerkung";
  "artikel": "artikelnummer" | "bezeichnung" | "einkaufspreis" | "verkaufspreis" | "mehrwertsteuersatz" | "lagerbestand" | "mindestbestand" | "lieferant" | "bemerkung";
  "auftraege": "auftragsnummer" | "auftragsdatum" | "lieferdatum" | "kunde" | "status" | "nettobetrag" | "mehrwertsteuerbetrag" | "bruttobetrag" | "bemerkung";
  "auftragspositionen": "auftrag" | "artikel" | "menge" | "einzelpreis_netto" | "mehrwertsteuersatz" | "positionsbetrag_netto" | "positionsbetrag_brutto";
  "lieferantenbestellungen": "bestellnummer" | "bestelldatum" | "lieferant" | "status" | "bemerkung";
  "bestellpositionen": "bestellung" | "artikel" | "menge" | "einkaufspreis";
  "lagerbewegungen": "bewegungstyp" | "artikel" | "menge" | "datum" | "auftrag" | "bestellung" | "bemerkung";
  "rechnungen": "rechnungsnummer" | "rechnungsdatum" | "faelligkeitsdatum" | "auftrag" | "nettobetrag" | "mehrwertsteuerbetrag" | "bruttobetrag" | "status" | "bemerkung";
  "zahlungseingaenge": "rechnung" | "zahlungsbetrag" | "zahlungsdatum" | "zahlungsart" | "bemerkung";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
