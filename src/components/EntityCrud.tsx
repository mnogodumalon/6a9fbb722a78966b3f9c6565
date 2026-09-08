/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'lieferanten'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.lieferanten.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.lieferanten.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.lieferanten.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.lieferanten              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   lieferanten: firmenname, ansprechpartner_vorname, ansprechpartner_nachname, strasse, hausnummer, plz, ort, email, …  ·  ← artikel (list + contextual +) · ← lieferantenbestellungen (list + contextual +)
 *   kunden: firmenname, ansprechpartner_vorname, ansprechpartner_nachname, strasse, hausnummer, plz, ort, email, …  ·  ← auftraege (list + contextual +)
 *   artikel: artikelnummer, bezeichnung, einkaufspreis, verkaufspreis, mehrwertsteuersatz, lagerbestand, mindestbestand, lieferant, …  ·  → lieferanten · ← auftragspositionen (list + contextual +) · ← bestellpositionen (list + contextual +) · ← lagerbewegungen (list + contextual +)
 *   auftraege: auftragsnummer, auftragsdatum, lieferdatum, kunde, status, nettobetrag, mehrwertsteuerbetrag, bruttobetrag, …  ·  → kunden · ← auftragspositionen (list + contextual +) · ← lagerbewegungen (list + contextual +) · ← rechnungen (list + contextual +)
 *   auftragspositionen: auftrag, artikel, menge, einzelpreis_netto, mehrwertsteuersatz, positionsbetrag_netto, positionsbetrag_brutto  ·  → auftraege · → artikel
 *   lieferantenbestellungen: bestellnummer, bestelldatum, lieferant, status, bemerkung  ·  → lieferanten · ← bestellpositionen (list + contextual +) · ← lagerbewegungen (list + contextual +)
 *   bestellpositionen: bestellung, artikel, menge, einkaufspreis  ·  → lieferantenbestellungen · → artikel
 *   lagerbewegungen: bewegungstyp, artikel, menge, datum, auftrag, bestellung, bemerkung  ·  → artikel · → auftraege · → lieferantenbestellungen
 *   rechnungen: rechnungsnummer, rechnungsdatum, faelligkeitsdatum, auftrag, nettobetrag, mehrwertsteuerbetrag, bruttobetrag, status, …  ·  → auftraege · ← zahlungseingaenge (list + contextual +)
 *   zahlungseingaenge: rechnung, zahlungsbetrag, zahlungsdatum, zahlungsart, bemerkung  ·  → rechnungen
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Lieferanten, Kunden, Artikel, Auftraege, Auftragspositionen, Lieferantenbestellungen, Bestellpositionen, Lagerbewegungen, Rechnungen, Zahlungseingaenge } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichArtikel, enrichAuftraege, enrichAuftragspositionen, enrichLieferantenbestellungen, enrichBestellpositionen, enrichLagerbewegungen, enrichRechnungen, enrichZahlungseingaenge } from '@/lib/enrich';
import type { EnrichedArtikel, EnrichedAuftraege, EnrichedAuftragspositionen, EnrichedLieferantenbestellungen, EnrichedBestellpositionen, EnrichedLagerbewegungen, EnrichedRechnungen, EnrichedZahlungseingaenge } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { LieferantenDialog, type LieferantenDialogDefaults } from '@/components/dialogs/LieferantenDialog';
import { LieferantenDetails } from '@/components/details/LieferantenDetails';
import { KundenDialog, type KundenDialogDefaults } from '@/components/dialogs/KundenDialog';
import { KundenDetails } from '@/components/details/KundenDetails';
import { ArtikelDialog, type ArtikelDialogDefaults } from '@/components/dialogs/ArtikelDialog';
import { ArtikelDetails } from '@/components/details/ArtikelDetails';
import { AuftraegeDialog, type AuftraegeDialogDefaults } from '@/components/dialogs/AuftraegeDialog';
import { AuftraegeDetails } from '@/components/details/AuftraegeDetails';
import { AuftragspositionenDialog, type AuftragspositionenDialogDefaults } from '@/components/dialogs/AuftragspositionenDialog';
import { AuftragspositionenDetails } from '@/components/details/AuftragspositionenDetails';
import { LieferantenbestellungenDialog, type LieferantenbestellungenDialogDefaults } from '@/components/dialogs/LieferantenbestellungenDialog';
import { LieferantenbestellungenDetails } from '@/components/details/LieferantenbestellungenDetails';
import { BestellpositionenDialog, type BestellpositionenDialogDefaults } from '@/components/dialogs/BestellpositionenDialog';
import { BestellpositionenDetails } from '@/components/details/BestellpositionenDetails';
import { LagerbewegungenDialog, type LagerbewegungenDialogDefaults } from '@/components/dialogs/LagerbewegungenDialog';
import { LagerbewegungenDetails } from '@/components/details/LagerbewegungenDetails';
import { RechnungenDialog, type RechnungenDialogDefaults } from '@/components/dialogs/RechnungenDialog';
import { RechnungenDetails } from '@/components/details/RechnungenDetails';
import { ZahlungseingaengeDialog, type ZahlungseingaengeDialogDefaults } from '@/components/dialogs/ZahlungseingaengeDialog';
import { ZahlungseingaengeDetails } from '@/components/details/ZahlungseingaengeDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'lieferanten'; record: Lieferanten }
  | { type: 'kunden'; record: Kunden }
  | { type: 'artikel'; record: EnrichedArtikel }
  | { type: 'auftraege'; record: EnrichedAuftraege }
  | { type: 'auftragspositionen'; record: EnrichedAuftragspositionen }
  | { type: 'lieferantenbestellungen'; record: EnrichedLieferantenbestellungen }
  | { type: 'bestellpositionen'; record: EnrichedBestellpositionen }
  | { type: 'lagerbewegungen'; record: EnrichedLagerbewegungen }
  | { type: 'rechnungen'; record: EnrichedRechnungen }
  | { type: 'zahlungseingaenge'; record: EnrichedZahlungseingaenge };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  lieferanten: EntityCrudApi<Lieferanten, LieferantenDialogDefaults>;
  kunden: EntityCrudApi<Kunden, KundenDialogDefaults>;
  artikel: EntityCrudApi<Artikel, ArtikelDialogDefaults>;
  auftraege: EntityCrudApi<Auftraege, AuftraegeDialogDefaults>;
  auftragspositionen: EntityCrudApi<Auftragspositionen, AuftragspositionenDialogDefaults>;
  lieferantenbestellungen: EntityCrudApi<Lieferantenbestellungen, LieferantenbestellungenDialogDefaults>;
  bestellpositionen: EntityCrudApi<Bestellpositionen, BestellpositionenDialogDefaults>;
  lagerbewegungen: EntityCrudApi<Lagerbewegungen, LagerbewegungenDialogDefaults>;
  rechnungen: EntityCrudApi<Rechnungen, RechnungenDialogDefaults>;
  zahlungseingaenge: EntityCrudApi<Zahlungseingaenge, ZahlungseingaengeDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { lieferanten: Lieferanten[]; kunden: Kunden[]; artikel: EnrichedArtikel[]; auftraege: EnrichedAuftraege[]; auftragspositionen: EnrichedAuftragspositionen[]; lieferantenbestellungen: EnrichedLieferantenbestellungen[]; bestellpositionen: EnrichedBestellpositionen[]; lagerbewegungen: EnrichedLagerbewegungen[]; rechnungen: EnrichedRechnungen[]; zahlungseingaenge: EnrichedZahlungseingaenge[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [lieferantenDialog, setLieferantenDialog] = useState<{ defaults?: LieferantenDialogDefaults; editing?: Lieferanten } | null>(null);
  const [kundenDialog, setKundenDialog] = useState<{ defaults?: KundenDialogDefaults; editing?: Kunden } | null>(null);
  const [artikelDialog, setArtikelDialog] = useState<{ defaults?: ArtikelDialogDefaults; editing?: Artikel } | null>(null);
  const [auftraegeDialog, setAuftraegeDialog] = useState<{ defaults?: AuftraegeDialogDefaults; editing?: Auftraege } | null>(null);
  const [auftragspositionenDialog, setAuftragspositionenDialog] = useState<{ defaults?: AuftragspositionenDialogDefaults; editing?: Auftragspositionen } | null>(null);
  const [lieferantenbestellungenDialog, setLieferantenbestellungenDialog] = useState<{ defaults?: LieferantenbestellungenDialogDefaults; editing?: Lieferantenbestellungen } | null>(null);
  const [bestellpositionenDialog, setBestellpositionenDialog] = useState<{ defaults?: BestellpositionenDialogDefaults; editing?: Bestellpositionen } | null>(null);
  const [lagerbewegungenDialog, setLagerbewegungenDialog] = useState<{ defaults?: LagerbewegungenDialogDefaults; editing?: Lagerbewegungen } | null>(null);
  const [rechnungenDialog, setRechnungenDialog] = useState<{ defaults?: RechnungenDialogDefaults; editing?: Rechnungen } | null>(null);
  const [zahlungseingaengeDialog, setZahlungseingaengeDialog] = useState<{ defaults?: ZahlungseingaengeDialogDefaults; editing?: Zahlungseingaenge } | null>(null);
  const enrichedArtikel = useMemo(() => enrichArtikel(data.artikel, { lieferantenMap: data.lieferantenMap }), [data.artikel, data.lieferantenMap]);
  const enrichedAuftraege = useMemo(() => enrichAuftraege(data.auftraege, { kundenMap: data.kundenMap }), [data.auftraege, data.kundenMap]);
  const enrichedAuftragspositionen = useMemo(() => enrichAuftragspositionen(data.auftragspositionen, { auftraegeMap: data.auftraegeMap, artikelMap: data.artikelMap }), [data.auftragspositionen, data.auftraegeMap, data.artikelMap]);
  const enrichedLieferantenbestellungen = useMemo(() => enrichLieferantenbestellungen(data.lieferantenbestellungen, { lieferantenMap: data.lieferantenMap }), [data.lieferantenbestellungen, data.lieferantenMap]);
  const enrichedBestellpositionen = useMemo(() => enrichBestellpositionen(data.bestellpositionen, { lieferantenbestellungenMap: data.lieferantenbestellungenMap, artikelMap: data.artikelMap }), [data.bestellpositionen, data.lieferantenbestellungenMap, data.artikelMap]);
  const enrichedLagerbewegungen = useMemo(() => enrichLagerbewegungen(data.lagerbewegungen, { artikelMap: data.artikelMap, auftraegeMap: data.auftraegeMap, lieferantenbestellungenMap: data.lieferantenbestellungenMap }), [data.lagerbewegungen, data.artikelMap, data.auftraegeMap, data.lieferantenbestellungenMap]);
  const enrichedRechnungen = useMemo(() => enrichRechnungen(data.rechnungen, { auftraegeMap: data.auftraegeMap }), [data.rechnungen, data.auftraegeMap]);
  const enrichedZahlungseingaenge = useMemo(() => enrichZahlungseingaenge(data.zahlungseingaenge, { rechnungenMap: data.rechnungenMap }), [data.zahlungseingaenge, data.rechnungenMap]);

  function detailLieferanten(record: Lieferanten, push = false) {
    const item: OverlayItem = { type: 'lieferanten', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitLieferanten(fields: Lieferanten['fields']) {
    const editing = lieferantenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setLieferanten(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateLieferantenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('lieferanten')} — ${t('crud_updated')}`, async () => {
        data.setLieferanten(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateLieferantenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createLieferantenEntry(fields);
      undoToast(`${appLabel('lieferanten')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailKunden(record: Kunden, push = false) {
    const item: OverlayItem = { type: 'kunden', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKunden(fields: Kunden['fields']) {
    const editing = kundenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKunden(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKundenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kunden')} — ${t('crud_updated')}`, async () => {
        data.setKunden(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKundenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKundenEntry(fields);
      undoToast(`${appLabel('kunden')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailArtikel(record: Artikel, push = false) {
    const rec = enrichedArtikel.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'artikel', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitArtikel(fields: Artikel['fields']) {
    const editing = artikelDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setArtikel(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateArtikelEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('artikel')} — ${t('crud_updated')}`, async () => {
        data.setArtikel(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateArtikelEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createArtikelEntry(fields);
      undoToast(`${appLabel('artikel')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAuftraege(record: Auftraege, push = false) {
    const rec = enrichedAuftraege.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'auftraege', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAuftraege(fields: Auftraege['fields']) {
    const editing = auftraegeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAuftraege(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAuftraegeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('auftraege')} — ${t('crud_updated')}`, async () => {
        data.setAuftraege(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAuftraegeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAuftraegeEntry(fields);
      undoToast(`${appLabel('auftraege')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAuftragspositionen(record: Auftragspositionen, push = false) {
    const rec = enrichedAuftragspositionen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'auftragspositionen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAuftragspositionen(fields: Auftragspositionen['fields']) {
    const editing = auftragspositionenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAuftragspositionen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAuftragspositionenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('auftragspositionen')} — ${t('crud_updated')}`, async () => {
        data.setAuftragspositionen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAuftragspositionenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAuftragspositionenEntry(fields);
      undoToast(`${appLabel('auftragspositionen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailLieferantenbestellungen(record: Lieferantenbestellungen, push = false) {
    const rec = enrichedLieferantenbestellungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'lieferantenbestellungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitLieferantenbestellungen(fields: Lieferantenbestellungen['fields']) {
    const editing = lieferantenbestellungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setLieferantenbestellungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateLieferantenbestellungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('lieferantenbestellungen')} — ${t('crud_updated')}`, async () => {
        data.setLieferantenbestellungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateLieferantenbestellungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createLieferantenbestellungenEntry(fields);
      undoToast(`${appLabel('lieferantenbestellungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailBestellpositionen(record: Bestellpositionen, push = false) {
    const rec = enrichedBestellpositionen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'bestellpositionen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBestellpositionen(fields: Bestellpositionen['fields']) {
    const editing = bestellpositionenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBestellpositionen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBestellpositionenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('bestellpositionen')} — ${t('crud_updated')}`, async () => {
        data.setBestellpositionen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBestellpositionenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createBestellpositionenEntry(fields);
      undoToast(`${appLabel('bestellpositionen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailLagerbewegungen(record: Lagerbewegungen, push = false) {
    const rec = enrichedLagerbewegungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'lagerbewegungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitLagerbewegungen(fields: Lagerbewegungen['fields']) {
    const editing = lagerbewegungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setLagerbewegungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateLagerbewegungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('lagerbewegungen')} — ${t('crud_updated')}`, async () => {
        data.setLagerbewegungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateLagerbewegungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createLagerbewegungenEntry(fields);
      undoToast(`${appLabel('lagerbewegungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailRechnungen(record: Rechnungen, push = false) {
    const rec = enrichedRechnungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'rechnungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitRechnungen(fields: Rechnungen['fields']) {
    const editing = rechnungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setRechnungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateRechnungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('rechnungen')} — ${t('crud_updated')}`, async () => {
        data.setRechnungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateRechnungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createRechnungenEntry(fields);
      undoToast(`${appLabel('rechnungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailZahlungseingaenge(record: Zahlungseingaenge, push = false) {
    const rec = enrichedZahlungseingaenge.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'zahlungseingaenge', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitZahlungseingaenge(fields: Zahlungseingaenge['fields']) {
    const editing = zahlungseingaengeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setZahlungseingaenge(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateZahlungseingaengeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('zahlungseingaenge')} — ${t('crud_updated')}`, async () => {
        data.setZahlungseingaenge(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateZahlungseingaengeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createZahlungseingaengeEntry(fields);
      undoToast(`${appLabel('zahlungseingaenge')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <LieferantenDialog
        open={lieferantenDialog !== null}
        onClose={() => setLieferantenDialog(null)}
        onSubmit={submitLieferanten}
        defaultValues={lieferantenDialog?.defaults}
        recordId={lieferantenDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Lieferanten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Lieferanten']}
      />
      <KundenDialog
        open={kundenDialog !== null}
        onClose={() => setKundenDialog(null)}
        onSubmit={submitKunden}
        defaultValues={kundenDialog?.defaults}
        recordId={kundenDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Kunden']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kunden']}
      />
      <ArtikelDialog
        open={artikelDialog !== null}
        onClose={() => setArtikelDialog(null)}
        onSubmit={submitArtikel}
        defaultValues={artikelDialog?.defaults}
        recordId={artikelDialog?.editing?.record_id}
        lieferantenList={data.lieferanten}
        enablePhotoScan={AI_PHOTO_SCAN['Artikel']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Artikel']}
      />
      <AuftraegeDialog
        open={auftraegeDialog !== null}
        onClose={() => setAuftraegeDialog(null)}
        onSubmit={submitAuftraege}
        defaultValues={auftraegeDialog?.defaults}
        recordId={auftraegeDialog?.editing?.record_id}
        kundenList={data.kunden}
        enablePhotoScan={AI_PHOTO_SCAN['Auftraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Auftraege']}
      />
      <AuftragspositionenDialog
        open={auftragspositionenDialog !== null}
        onClose={() => setAuftragspositionenDialog(null)}
        onSubmit={submitAuftragspositionen}
        defaultValues={auftragspositionenDialog?.defaults}
        recordId={auftragspositionenDialog?.editing?.record_id}
        auftraegeList={data.auftraege}
        artikelList={data.artikel}
        enablePhotoScan={AI_PHOTO_SCAN['Auftragspositionen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Auftragspositionen']}
      />
      <LieferantenbestellungenDialog
        open={lieferantenbestellungenDialog !== null}
        onClose={() => setLieferantenbestellungenDialog(null)}
        onSubmit={submitLieferantenbestellungen}
        defaultValues={lieferantenbestellungenDialog?.defaults}
        recordId={lieferantenbestellungenDialog?.editing?.record_id}
        lieferantenList={data.lieferanten}
        enablePhotoScan={AI_PHOTO_SCAN['Lieferantenbestellungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Lieferantenbestellungen']}
      />
      <BestellpositionenDialog
        open={bestellpositionenDialog !== null}
        onClose={() => setBestellpositionenDialog(null)}
        onSubmit={submitBestellpositionen}
        defaultValues={bestellpositionenDialog?.defaults}
        recordId={bestellpositionenDialog?.editing?.record_id}
        lieferantenbestellungenList={data.lieferantenbestellungen}
        artikelList={data.artikel}
        enablePhotoScan={AI_PHOTO_SCAN['Bestellpositionen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bestellpositionen']}
      />
      <LagerbewegungenDialog
        open={lagerbewegungenDialog !== null}
        onClose={() => setLagerbewegungenDialog(null)}
        onSubmit={submitLagerbewegungen}
        defaultValues={lagerbewegungenDialog?.defaults}
        recordId={lagerbewegungenDialog?.editing?.record_id}
        artikelList={data.artikel}
        auftraegeList={data.auftraege}
        lieferantenbestellungenList={data.lieferantenbestellungen}
        enablePhotoScan={AI_PHOTO_SCAN['Lagerbewegungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Lagerbewegungen']}
      />
      <RechnungenDialog
        open={rechnungenDialog !== null}
        onClose={() => setRechnungenDialog(null)}
        onSubmit={submitRechnungen}
        defaultValues={rechnungenDialog?.defaults}
        recordId={rechnungenDialog?.editing?.record_id}
        auftraegeList={data.auftraege}
        enablePhotoScan={AI_PHOTO_SCAN['Rechnungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Rechnungen']}
      />
      <ZahlungseingaengeDialog
        open={zahlungseingaengeDialog !== null}
        onClose={() => setZahlungseingaengeDialog(null)}
        onSubmit={submitZahlungseingaenge}
        defaultValues={zahlungseingaengeDialog?.defaults}
        recordId={zahlungseingaengeDialog?.editing?.record_id}
        rechnungenList={data.rechnungen}
        enablePhotoScan={AI_PHOTO_SCAN['Zahlungseingaenge']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Zahlungseingaenge']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'lieferanten') {
            return (
              <>
                <RecordHeader title={top.record.fields.firmenname ?? appLabel('lieferanten')} subtitle={undefined} />
                <LieferantenDetails
                  record={top.record}
                  artikelList={data.artikel}
                  onOpenArtikel={(r) => detailArtikel(r, true)}
                  onAddArtikel={() => setArtikelDialog({ defaults: { lieferant: createRecordUrl(APP_IDS.LIEFERANTEN, top.record.record_id) } })}
                  lieferantenbestellungenList={data.lieferantenbestellungen}
                  onOpenLieferantenbestellungen={(r) => detailLieferantenbestellungen(r, true)}
                  onAddLieferantenbestellungen={() => setLieferantenbestellungenDialog({ defaults: { lieferant: createRecordUrl(APP_IDS.LIEFERANTEN, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'kunden') {
            return (
              <>
                <RecordHeader title={top.record.fields.firmenname ?? appLabel('kunden')} subtitle={undefined} />
                <KundenDetails
                  record={top.record}
                  auftraegeList={data.auftraege}
                  onOpenAuftraege={(r) => detailAuftraege(r, true)}
                  onAddAuftraege={() => setAuftraegeDialog({ defaults: { kunde: createRecordUrl(APP_IDS.KUNDEN, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'artikel') {
            return (
              <>
                <RecordHeader title={top.record.fields.artikelnummer ?? appLabel('artikel')} subtitle={undefined} />
                <ArtikelDetails
                  record={top.record}
                  lieferantenList={data.lieferanten}
                  onOpenLieferanten={(r) => detailLieferanten(r, true)}
                  auftragspositionenList={data.auftragspositionen}
                  onOpenAuftragspositionen={(r) => detailAuftragspositionen(r, true)}
                  onAddAuftragspositionen={() => setAuftragspositionenDialog({ defaults: { artikel: createRecordUrl(APP_IDS.ARTIKEL, top.record.record_id) } })}
                  bestellpositionenList={data.bestellpositionen}
                  onOpenBestellpositionen={(r) => detailBestellpositionen(r, true)}
                  onAddBestellpositionen={() => setBestellpositionenDialog({ defaults: { artikel: createRecordUrl(APP_IDS.ARTIKEL, top.record.record_id) } })}
                  lagerbewegungenList={data.lagerbewegungen}
                  onOpenLagerbewegungen={(r) => detailLagerbewegungen(r, true)}
                  onAddLagerbewegungen={() => setLagerbewegungenDialog({ defaults: { artikel: createRecordUrl(APP_IDS.ARTIKEL, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'auftraege') {
            return (
              <>
                <RecordHeader title={top.record.fields.auftragsnummer ?? appLabel('auftraege')} subtitle={top.record.fields.auftragsdatum ? formatDate(top.record.fields.auftragsdatum) : undefined} />
                <AuftraegeDetails
                  record={top.record}
                  kundenList={data.kunden}
                  onOpenKunden={(r) => detailKunden(r, true)}
                  auftragspositionenList={data.auftragspositionen}
                  onOpenAuftragspositionen={(r) => detailAuftragspositionen(r, true)}
                  onAddAuftragspositionen={() => setAuftragspositionenDialog({ defaults: { auftrag: createRecordUrl(APP_IDS.AUFTRAEGE, top.record.record_id) } })}
                  lagerbewegungenList={data.lagerbewegungen}
                  onOpenLagerbewegungen={(r) => detailLagerbewegungen(r, true)}
                  onAddLagerbewegungen={() => setLagerbewegungenDialog({ defaults: { auftrag: createRecordUrl(APP_IDS.AUFTRAEGE, top.record.record_id) } })}
                  rechnungenList={data.rechnungen}
                  onOpenRechnungen={(r) => detailRechnungen(r, true)}
                  onAddRechnungen={() => setRechnungenDialog({ defaults: { auftrag: createRecordUrl(APP_IDS.AUFTRAEGE, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'auftragspositionen') {
            return (
              <>
                <RecordHeader title={appLabel('auftragspositionen')} subtitle={undefined} />
                <AuftragspositionenDetails
                  record={top.record}
                  auftraegeList={data.auftraege}
                  onOpenAuftraege={(r) => detailAuftraege(r, true)}
                  artikelList={data.artikel}
                  onOpenArtikel={(r) => detailArtikel(r, true)}
                />
              </>
            );
          }
          if (top.type === 'lieferantenbestellungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.bestellnummer ?? appLabel('lieferantenbestellungen')} subtitle={top.record.fields.bestelldatum ? formatDate(top.record.fields.bestelldatum) : undefined} />
                <LieferantenbestellungenDetails
                  record={top.record}
                  lieferantenList={data.lieferanten}
                  onOpenLieferanten={(r) => detailLieferanten(r, true)}
                  bestellpositionenList={data.bestellpositionen}
                  onOpenBestellpositionen={(r) => detailBestellpositionen(r, true)}
                  onAddBestellpositionen={() => setBestellpositionenDialog({ defaults: { bestellung: createRecordUrl(APP_IDS.LIEFERANTENBESTELLUNGEN, top.record.record_id) } })}
                  lagerbewegungenList={data.lagerbewegungen}
                  onOpenLagerbewegungen={(r) => detailLagerbewegungen(r, true)}
                  onAddLagerbewegungen={() => setLagerbewegungenDialog({ defaults: { bestellung: createRecordUrl(APP_IDS.LIEFERANTENBESTELLUNGEN, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'bestellpositionen') {
            return (
              <>
                <RecordHeader title={appLabel('bestellpositionen')} subtitle={undefined} />
                <BestellpositionenDetails
                  record={top.record}
                  lieferantenbestellungenList={data.lieferantenbestellungen}
                  onOpenLieferantenbestellungen={(r) => detailLieferantenbestellungen(r, true)}
                  artikelList={data.artikel}
                  onOpenArtikel={(r) => detailArtikel(r, true)}
                />
              </>
            );
          }
          if (top.type === 'lagerbewegungen') {
            return (
              <>
                <RecordHeader title={appLabel('lagerbewegungen')} subtitle={top.record.fields.datum ? formatDate(top.record.fields.datum) : undefined} />
                <LagerbewegungenDetails
                  record={top.record}
                  artikelList={data.artikel}
                  onOpenArtikel={(r) => detailArtikel(r, true)}
                  auftraegeList={data.auftraege}
                  onOpenAuftraege={(r) => detailAuftraege(r, true)}
                  lieferantenbestellungenList={data.lieferantenbestellungen}
                  onOpenLieferantenbestellungen={(r) => detailLieferantenbestellungen(r, true)}
                />
              </>
            );
          }
          if (top.type === 'rechnungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.rechnungsnummer ?? appLabel('rechnungen')} subtitle={top.record.fields.rechnungsdatum ? formatDate(top.record.fields.rechnungsdatum) : undefined} />
                <RechnungenDetails
                  record={top.record}
                  auftraegeList={data.auftraege}
                  onOpenAuftraege={(r) => detailAuftraege(r, true)}
                  zahlungseingaengeList={data.zahlungseingaenge}
                  onOpenZahlungseingaenge={(r) => detailZahlungseingaenge(r, true)}
                  onAddZahlungseingaenge={() => setZahlungseingaengeDialog({ defaults: { rechnung: createRecordUrl(APP_IDS.RECHNUNGEN, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'zahlungseingaenge') {
            return (
              <>
                <RecordHeader title={appLabel('zahlungseingaenge')} subtitle={top.record.fields.zahlungsdatum ? formatDate(top.record.fields.zahlungsdatum) : undefined} />
                <ZahlungseingaengeDetails
                  record={top.record}
                  rechnungenList={data.rechnungen}
                  onOpenRechnungen={(r) => detailRechnungen(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'lieferanten') setLieferantenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'kunden') setKundenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'artikel') setArtikelDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'auftraege') setAuftraegeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'auftragspositionen') setAuftragspositionenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'lieferantenbestellungen') setLieferantenbestellungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'bestellpositionen') setBestellpositionenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'lagerbewegungen') setLagerbewegungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'rechnungen') setRechnungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'zahlungseingaenge') setZahlungseingaengeDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    lieferanten: {
      openCreate: (defaults?: LieferantenDialogDefaults) => setLieferantenDialog({ defaults }),
      openEdit: (record: Lieferanten) => setLieferantenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Lieferanten) => detailLieferanten(record, false),
    },
    kunden: {
      openCreate: (defaults?: KundenDialogDefaults) => setKundenDialog({ defaults }),
      openEdit: (record: Kunden) => setKundenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Kunden) => detailKunden(record, false),
    },
    artikel: {
      openCreate: (defaults?: ArtikelDialogDefaults) => setArtikelDialog({ defaults }),
      openEdit: (record: Artikel) => setArtikelDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Artikel) => detailArtikel(record, false),
    },
    auftraege: {
      openCreate: (defaults?: AuftraegeDialogDefaults) => setAuftraegeDialog({ defaults }),
      openEdit: (record: Auftraege) => setAuftraegeDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Auftraege) => detailAuftraege(record, false),
    },
    auftragspositionen: {
      openCreate: (defaults?: AuftragspositionenDialogDefaults) => setAuftragspositionenDialog({ defaults }),
      openEdit: (record: Auftragspositionen) => setAuftragspositionenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Auftragspositionen) => detailAuftragspositionen(record, false),
    },
    lieferantenbestellungen: {
      openCreate: (defaults?: LieferantenbestellungenDialogDefaults) => setLieferantenbestellungenDialog({ defaults }),
      openEdit: (record: Lieferantenbestellungen) => setLieferantenbestellungenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Lieferantenbestellungen) => detailLieferantenbestellungen(record, false),
    },
    bestellpositionen: {
      openCreate: (defaults?: BestellpositionenDialogDefaults) => setBestellpositionenDialog({ defaults }),
      openEdit: (record: Bestellpositionen) => setBestellpositionenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Bestellpositionen) => detailBestellpositionen(record, false),
    },
    lagerbewegungen: {
      openCreate: (defaults?: LagerbewegungenDialogDefaults) => setLagerbewegungenDialog({ defaults }),
      openEdit: (record: Lagerbewegungen) => setLagerbewegungenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Lagerbewegungen) => detailLagerbewegungen(record, false),
    },
    rechnungen: {
      openCreate: (defaults?: RechnungenDialogDefaults) => setRechnungenDialog({ defaults }),
      openEdit: (record: Rechnungen) => setRechnungenDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Rechnungen) => detailRechnungen(record, false),
    },
    zahlungseingaenge: {
      openCreate: (defaults?: ZahlungseingaengeDialogDefaults) => setZahlungseingaengeDialog({ defaults }),
      openEdit: (record: Zahlungseingaenge) => setZahlungseingaengeDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Zahlungseingaenge) => detailZahlungseingaenge(record, false),
    },
    enriched: { lieferanten: data.lieferanten, kunden: data.kunden, artikel: enrichedArtikel, auftraege: enrichedAuftraege, auftragspositionen: enrichedAuftragspositionen, lieferantenbestellungen: enrichedLieferantenbestellungen, bestellpositionen: enrichedBestellpositionen, lagerbewegungen: enrichedLagerbewegungen, rechnungen: enrichedRechnungen, zahlungseingaenge: enrichedZahlungseingaenge },
  };
}
