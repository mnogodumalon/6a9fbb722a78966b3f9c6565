/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'lieferanten' | 'kunden' | 'artikel' | 'auftraege' | 'auftragspositionen' | 'lieferantenbestellungen' | 'bestellpositionen' | 'lagerbewegungen' | 'rechnungen' | 'zahlungseingaenge';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "lieferanten": "firmenname" | "ansprechpartner_vorname" | "ansprechpartner_nachname" | "strasse" | "hausnummer" | "plz" | "ort" | "email" | "telefon" | "website" | "bemerkung";
  "kunden": "firmenname" | "ansprechpartner_vorname" | "ansprechpartner_nachname" | "strasse" | "hausnummer" | "plz" | "ort" | "email" | "telefon" | "bemerkung";
  "artikel": "artikelnummer" | "bezeichnung" | "bemerkung";
  "auftraege": "auftragsnummer" | "bemerkung";
  "auftragspositionen": never;
  "lieferantenbestellungen": "bestellnummer" | "bemerkung";
  "bestellpositionen": never;
  "lagerbewegungen": "bemerkung";
  "rechnungen": "rechnungsnummer" | "bemerkung";
  "zahlungseingaenge": "bemerkung";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "lieferanten": never;
  "kunden": never;
  "artikel": "lieferant";
  "auftraege": "kunde";
  "auftragspositionen": "auftrag" | "artikel";
  "lieferantenbestellungen": "lieferant";
  "bestellpositionen": "bestellung" | "artikel";
  "lagerbewegungen": "artikel" | "auftrag" | "bestellung";
  "rechnungen": "auftrag";
  "zahlungseingaenge": "rechnung";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "lieferanten": {
    "key": "lieferanten",
    "appId": "6a9fbb2ba8626ef96ec52a21",
    "label": "Lieferanten",
    "pascal": "Lieferanten",
    "single": "LieferantenEntry"
  },
  "kunden": {
    "key": "kunden",
    "appId": "6a9fbb32f5ce91be593387f3",
    "label": "Kunden",
    "pascal": "Kunden",
    "single": "KundenEntry"
  },
  "artikel": {
    "key": "artikel",
    "appId": "6a9fbb33e6aa8bab91e7f988",
    "label": "Artikel",
    "pascal": "Artikel",
    "single": "ArtikelEntry"
  },
  "auftraege": {
    "key": "auftraege",
    "appId": "6a9fbb34cf670edf18b526bb",
    "label": "Aufträge",
    "pascal": "Auftraege",
    "single": "AuftraegeEntry"
  },
  "auftragspositionen": {
    "key": "auftragspositionen",
    "appId": "6a9fbb34904f524f237678b4",
    "label": "Auftragspositionen",
    "pascal": "Auftragspositionen",
    "single": "AuftragspositionenEntry"
  },
  "lieferantenbestellungen": {
    "key": "lieferantenbestellungen",
    "appId": "6a9fbb35d3e7b03833d33a24",
    "label": "Lieferantenbestellungen",
    "pascal": "Lieferantenbestellungen",
    "single": "LieferantenbestellungenEntry"
  },
  "bestellpositionen": {
    "key": "bestellpositionen",
    "appId": "6a9fbb35ab1b61c1d7f42811",
    "label": "Bestellpositionen",
    "pascal": "Bestellpositionen",
    "single": "BestellpositionenEntry"
  },
  "lagerbewegungen": {
    "key": "lagerbewegungen",
    "appId": "6a9fbb3602be2c0316936892",
    "label": "Lagerbewegungen",
    "pascal": "Lagerbewegungen",
    "single": "LagerbewegungenEntry"
  },
  "rechnungen": {
    "key": "rechnungen",
    "appId": "6a9fbb37b68226534021f8ba",
    "label": "Rechnungen",
    "pascal": "Rechnungen",
    "single": "RechnungenEntry"
  },
  "zahlungseingaenge": {
    "key": "zahlungseingaenge",
    "appId": "6a9fbb3761af529c904618ca",
    "label": "Zahlungseingänge",
    "pascal": "Zahlungseingaenge",
    "single": "ZahlungseingaengeEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "lieferanten": {
    "firmenname": {
      "key": "firmenname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Firmenname",
      "writable": true,
      "maxLength": 4000
    },
    "ansprechpartner_vorname": {
      "key": "ansprechpartner_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ansprechpartner Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "ansprechpartner_nachname": {
      "key": "ansprechpartner_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ansprechpartner Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "PLZ",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "website": {
      "key": "website",
      "fulltype": "string/url",
      "kind": "url",
      "required": false,
      "label": "Website",
      "writable": true,
      "autoComplete": "url"
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  },
  "kunden": {
    "firmenname": {
      "key": "firmenname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Firmenname",
      "writable": true,
      "maxLength": 4000
    },
    "ansprechpartner_vorname": {
      "key": "ansprechpartner_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ansprechpartner Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "ansprechpartner_nachname": {
      "key": "ansprechpartner_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ansprechpartner Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "PLZ",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail",
      "writable": true,
      "autoComplete": "email"
    },
    "telefon": {
      "key": "telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "zahlungsziel_tage": {
      "key": "zahlungsziel_tage",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Zahlungsziel (Tage)",
      "writable": true
    },
    "kreditlimit": {
      "key": "kreditlimit",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Kreditlimit (€)",
      "writable": true,
      "format": "currency"
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  },
  "artikel": {
    "artikelnummer": {
      "key": "artikelnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Artikelnummer",
      "writable": true,
      "maxLength": 4000
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "einkaufspreis": {
      "key": "einkaufspreis",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Einkaufspreis (€)",
      "writable": true,
      "format": "currency"
    },
    "verkaufspreis": {
      "key": "verkaufspreis",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Verkaufspreis (€)",
      "writable": true,
      "format": "currency"
    },
    "mehrwertsteuersatz": {
      "key": "mehrwertsteuersatz",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Mehrwertsteuersatz",
      "writable": true,
      "options": [
        "mwst_7",
        "mwst_19"
      ]
    },
    "lagerbestand": {
      "key": "lagerbestand",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Aktueller Lagerbestand",
      "writable": true
    },
    "mindestbestand": {
      "key": "mindestbestand",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Mindestbestand",
      "writable": true
    },
    "lieferant": {
      "key": "lieferant",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Lieferant",
      "writable": true,
      "targetAppId": "6a9fbb2ba8626ef96ec52a21",
      "targetEntity": "lieferanten"
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  },
  "auftraege": {
    "auftragsnummer": {
      "key": "auftragsnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Auftragsnummer",
      "writable": true,
      "maxLength": 4000
    },
    "auftragsdatum": {
      "key": "auftragsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Auftragsdatum",
      "writable": true
    },
    "lieferdatum": {
      "key": "lieferdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Gewünschtes Lieferdatum",
      "writable": true
    },
    "kunde": {
      "key": "kunde",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Kunde",
      "writable": true,
      "targetAppId": "6a9fbb32f5ce91be593387f3",
      "targetEntity": "kunden"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "entwurf",
        "freigegeben",
        "geliefert",
        "abgerechnet",
        "storniert"
      ]
    },
    "nettobetrag": {
      "key": "nettobetrag",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Nettobetrag (€)",
      "writable": true,
      "format": "currency"
    },
    "mehrwertsteuerbetrag": {
      "key": "mehrwertsteuerbetrag",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Mehrwertsteuerbetrag (€)",
      "writable": true,
      "format": "currency"
    },
    "bruttobetrag": {
      "key": "bruttobetrag",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Bruttobetrag (€)",
      "writable": true,
      "format": "currency"
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  },
  "auftragspositionen": {
    "auftrag": {
      "key": "auftrag",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Auftrag",
      "writable": true,
      "targetAppId": "6a9fbb34cf670edf18b526bb",
      "targetEntity": "auftraege"
    },
    "artikel": {
      "key": "artikel",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Artikel",
      "writable": true,
      "targetAppId": "6a9fbb33e6aa8bab91e7f988",
      "targetEntity": "artikel"
    },
    "menge": {
      "key": "menge",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Menge",
      "writable": true
    },
    "einzelpreis_netto": {
      "key": "einzelpreis_netto",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Einzelpreis netto (€)",
      "writable": true,
      "format": "currency"
    },
    "mehrwertsteuersatz": {
      "key": "mehrwertsteuersatz",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Mehrwertsteuersatz",
      "writable": true,
      "options": [
        "mwst_7",
        "mwst_19"
      ]
    },
    "positionsbetrag_netto": {
      "key": "positionsbetrag_netto",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Positionsbetrag netto (€)",
      "writable": true,
      "format": "currency"
    },
    "positionsbetrag_brutto": {
      "key": "positionsbetrag_brutto",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Positionsbetrag brutto (€)",
      "writable": true,
      "format": "currency"
    }
  },
  "lieferantenbestellungen": {
    "bestellnummer": {
      "key": "bestellnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bestellnummer",
      "writable": true,
      "maxLength": 4000
    },
    "bestelldatum": {
      "key": "bestelldatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Bestelldatum",
      "writable": true
    },
    "lieferant": {
      "key": "lieferant",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Lieferant",
      "writable": true,
      "targetAppId": "6a9fbb2ba8626ef96ec52a21",
      "targetEntity": "lieferanten"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "offen",
        "bestellt",
        "eingegangen"
      ]
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  },
  "bestellpositionen": {
    "bestellung": {
      "key": "bestellung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Bestellung",
      "writable": true,
      "targetAppId": "6a9fbb35d3e7b03833d33a24",
      "targetEntity": "lieferantenbestellungen"
    },
    "artikel": {
      "key": "artikel",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Artikel",
      "writable": true,
      "targetAppId": "6a9fbb33e6aa8bab91e7f988",
      "targetEntity": "artikel"
    },
    "menge": {
      "key": "menge",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Menge",
      "writable": true
    },
    "einkaufspreis": {
      "key": "einkaufspreis",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Einkaufspreis (€)",
      "writable": true,
      "format": "currency"
    }
  },
  "lagerbewegungen": {
    "bewegungstyp": {
      "key": "bewegungstyp",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Bewegungstyp",
      "writable": true,
      "options": [
        "wareneingang",
        "warenausgang",
        "korrektur"
      ]
    },
    "artikel": {
      "key": "artikel",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Artikel",
      "writable": true,
      "targetAppId": "6a9fbb33e6aa8bab91e7f988",
      "targetEntity": "artikel"
    },
    "menge": {
      "key": "menge",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Menge",
      "writable": true
    },
    "datum": {
      "key": "datum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Datum",
      "writable": true
    },
    "auftrag": {
      "key": "auftrag",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Bezug: Auftrag",
      "writable": true,
      "targetAppId": "6a9fbb34cf670edf18b526bb",
      "targetEntity": "auftraege"
    },
    "bestellung": {
      "key": "bestellung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Bezug: Bestellung",
      "writable": true,
      "targetAppId": "6a9fbb35d3e7b03833d33a24",
      "targetEntity": "lieferantenbestellungen"
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  },
  "rechnungen": {
    "rechnungsnummer": {
      "key": "rechnungsnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Rechnungsnummer",
      "writable": true,
      "maxLength": 4000
    },
    "rechnungsdatum": {
      "key": "rechnungsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Rechnungsdatum",
      "writable": true
    },
    "faelligkeitsdatum": {
      "key": "faelligkeitsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Fälligkeitsdatum",
      "writable": true
    },
    "auftrag": {
      "key": "auftrag",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Auftrag",
      "writable": true,
      "targetAppId": "6a9fbb34cf670edf18b526bb",
      "targetEntity": "auftraege"
    },
    "nettobetrag": {
      "key": "nettobetrag",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Nettobetrag (€)",
      "writable": true,
      "format": "currency"
    },
    "mehrwertsteuerbetrag": {
      "key": "mehrwertsteuerbetrag",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Mehrwertsteuerbetrag (€)",
      "writable": true,
      "format": "currency"
    },
    "bruttobetrag": {
      "key": "bruttobetrag",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Bruttobetrag (€)",
      "writable": true,
      "format": "currency"
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "offen",
        "bezahlt",
        "ueberfaellig"
      ]
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  },
  "zahlungseingaenge": {
    "rechnung": {
      "key": "rechnung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Rechnung",
      "writable": true,
      "targetAppId": "6a9fbb37b68226534021f8ba",
      "targetEntity": "rechnungen"
    },
    "zahlungsbetrag": {
      "key": "zahlungsbetrag",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Zahlungsbetrag (€)",
      "writable": true,
      "format": "currency"
    },
    "zahlungsdatum": {
      "key": "zahlungsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Zahlungsdatum",
      "writable": true
    },
    "zahlungsart": {
      "key": "zahlungsart",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Zahlungsart",
      "writable": true,
      "options": [
        "lastschrift",
        "bar",
        "sonstige",
        "ueberweisung"
      ]
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "lieferanten": [],
  "kunden": [],
  "artikel": [
    {
      "kind": "choice",
      "field": "mehrwertsteuersatz",
      "count": 2
    },
    {
      "kind": "record",
      "field": "lieferant",
      "targetEntity": "lieferanten"
    },
    {
      "kind": "stock",
      "field": "lagerbestand"
    }
  ],
  "auftraege": [
    {
      "kind": "choice",
      "field": "status",
      "count": 5
    },
    {
      "kind": "record",
      "field": "kunde",
      "targetEntity": "kunden"
    }
  ],
  "auftragspositionen": [
    {
      "kind": "choice",
      "field": "mehrwertsteuersatz",
      "count": 2
    },
    {
      "kind": "record",
      "field": "auftrag",
      "targetEntity": "auftraege"
    },
    {
      "kind": "record",
      "field": "artikel",
      "targetEntity": "artikel"
    }
  ],
  "lieferantenbestellungen": [
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "lieferant",
      "targetEntity": "lieferanten"
    }
  ],
  "bestellpositionen": [
    {
      "kind": "record",
      "field": "bestellung",
      "targetEntity": "lieferantenbestellungen"
    },
    {
      "kind": "record",
      "field": "artikel",
      "targetEntity": "artikel"
    }
  ],
  "lagerbewegungen": [
    {
      "kind": "choice",
      "field": "bewegungstyp",
      "count": 3
    },
    {
      "kind": "record",
      "field": "artikel",
      "targetEntity": "artikel"
    },
    {
      "kind": "record",
      "field": "auftrag",
      "targetEntity": "auftraege"
    },
    {
      "kind": "record",
      "field": "bestellung",
      "targetEntity": "lieferantenbestellungen"
    }
  ],
  "rechnungen": [
    {
      "kind": "choice",
      "field": "status",
      "count": 3
    },
    {
      "kind": "record",
      "field": "auftrag",
      "targetEntity": "auftraege"
    }
  ],
  "zahlungseingaenge": [
    {
      "kind": "choice",
      "field": "zahlungsart",
      "count": 4
    },
    {
      "kind": "record",
      "field": "rechnung",
      "targetEntity": "rechnungen"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "lieferanten": [
    "firmenname"
  ],
  "kunden": [
    "firmenname"
  ],
  "artikel": [
    "artikelnummer"
  ],
  "auftraege": [
    "auftragsnummer"
  ],
  "auftragspositionen": [
    "auftrag"
  ],
  "lieferantenbestellungen": [
    "bestellnummer"
  ],
  "bestellpositionen": [
    "bestellung"
  ],
  "lagerbewegungen": [
    "bemerkung"
  ],
  "rechnungen": [
    "rechnungsnummer"
  ],
  "zahlungseingaenge": [
    "bemerkung"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => fields[k])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map(v => v.trim());
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — runtime bundle first, generated label second. */
export function labelOf(entity: EntityKey, key: string): string {
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
