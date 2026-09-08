import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Lieferanten, Kunden, Artikel, Auftraege, Auftragspositionen, Lieferantenbestellungen, Bestellpositionen, Lagerbewegungen, Rechnungen, Zahlungseingaenge } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'lieferanten' | 'kunden' | 'artikel' | 'auftraege' | 'auftragspositionen' | 'lieferantenbestellungen' | 'bestellpositionen' | 'lagerbewegungen' | 'rechnungen' | 'zahlungseingaenge';

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [lieferanten, setLieferanten] = useState<Lieferanten[]>([]);
  const [kunden, setKunden] = useState<Kunden[]>([]);
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [auftraege, setAuftraege] = useState<Auftraege[]>([]);
  const [auftragspositionen, setAuftragspositionen] = useState<Auftragspositionen[]>([]);
  const [lieferantenbestellungen, setLieferantenbestellungen] = useState<Lieferantenbestellungen[]>([]);
  const [bestellpositionen, setBestellpositionen] = useState<Bestellpositionen[]>([]);
  const [lagerbewegungen, setLagerbewegungen] = useState<Lagerbewegungen[]>([]);
  const [rechnungen, setRechnungen] = useState<Rechnungen[]>([]);
  const [zahlungseingaenge, setZahlungseingaenge] = useState<Zahlungseingaenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const [lieferantenData, kundenData, artikelData, auftraegeData, auftragspositionenData, lieferantenbestellungenData, bestellpositionenData, lagerbewegungenData, rechnungenData, zahlungseingaengeData] = await Promise.all([
        omit.has('lieferanten') ? Promise.resolve([] as Lieferanten[]) : LivingAppsService.getLieferanten(),
        omit.has('kunden') ? Promise.resolve([] as Kunden[]) : LivingAppsService.getKunden(),
        omit.has('artikel') ? Promise.resolve([] as Artikel[]) : LivingAppsService.getArtikel(),
        omit.has('auftraege') ? Promise.resolve([] as Auftraege[]) : LivingAppsService.getAuftraege(),
        omit.has('auftragspositionen') ? Promise.resolve([] as Auftragspositionen[]) : LivingAppsService.getAuftragspositionen(),
        omit.has('lieferantenbestellungen') ? Promise.resolve([] as Lieferantenbestellungen[]) : LivingAppsService.getLieferantenbestellungen(),
        omit.has('bestellpositionen') ? Promise.resolve([] as Bestellpositionen[]) : LivingAppsService.getBestellpositionen(),
        omit.has('lagerbewegungen') ? Promise.resolve([] as Lagerbewegungen[]) : LivingAppsService.getLagerbewegungen(),
        omit.has('rechnungen') ? Promise.resolve([] as Rechnungen[]) : LivingAppsService.getRechnungen(),
        omit.has('zahlungseingaenge') ? Promise.resolve([] as Zahlungseingaenge[]) : LivingAppsService.getZahlungseingaenge(),
      ]);
      setLieferanten(lieferantenData);
      setKunden(kundenData);
      setArtikel(artikelData);
      setAuftraege(auftraegeData);
      setAuftragspositionen(auftragspositionenData);
      setLieferantenbestellungen(lieferantenbestellungenData);
      setBestellpositionen(bestellpositionenData);
      setLagerbewegungen(lagerbewegungenData);
      setRechnungen(rechnungenData);
      setZahlungseingaenge(zahlungseingaengeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        const [lieferantenData, kundenData, artikelData, auftraegeData, auftragspositionenData, lieferantenbestellungenData, bestellpositionenData, lagerbewegungenData, rechnungenData, zahlungseingaengeData] = await Promise.all([
          omit.has('lieferanten') ? Promise.resolve([] as Lieferanten[]) : LivingAppsService.getLieferanten(),
          omit.has('kunden') ? Promise.resolve([] as Kunden[]) : LivingAppsService.getKunden(),
          omit.has('artikel') ? Promise.resolve([] as Artikel[]) : LivingAppsService.getArtikel(),
          omit.has('auftraege') ? Promise.resolve([] as Auftraege[]) : LivingAppsService.getAuftraege(),
          omit.has('auftragspositionen') ? Promise.resolve([] as Auftragspositionen[]) : LivingAppsService.getAuftragspositionen(),
          omit.has('lieferantenbestellungen') ? Promise.resolve([] as Lieferantenbestellungen[]) : LivingAppsService.getLieferantenbestellungen(),
          omit.has('bestellpositionen') ? Promise.resolve([] as Bestellpositionen[]) : LivingAppsService.getBestellpositionen(),
          omit.has('lagerbewegungen') ? Promise.resolve([] as Lagerbewegungen[]) : LivingAppsService.getLagerbewegungen(),
          omit.has('rechnungen') ? Promise.resolve([] as Rechnungen[]) : LivingAppsService.getRechnungen(),
          omit.has('zahlungseingaenge') ? Promise.resolve([] as Zahlungseingaenge[]) : LivingAppsService.getZahlungseingaenge(),
        ]);
        setLieferanten(lieferantenData);
        setKunden(kundenData);
        setArtikel(artikelData);
        setAuftraege(auftraegeData);
        setAuftragspositionen(auftragspositionenData);
        setLieferantenbestellungen(lieferantenbestellungenData);
        setBestellpositionen(bestellpositionenData);
        setLagerbewegungen(lagerbewegungenData);
        setRechnungen(rechnungenData);
        setZahlungseingaenge(zahlungseingaengeData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    return () => window.removeEventListener('assistant:data-changed', handleRefresh);
  }, [omitKey]);

  const lieferantenMap = useMemo(() => {
    const m = new Map<string, Lieferanten>();
    lieferanten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [lieferanten]);

  const kundenMap = useMemo(() => {
    const m = new Map<string, Kunden>();
    kunden.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kunden]);

  const artikelMap = useMemo(() => {
    const m = new Map<string, Artikel>();
    artikel.forEach(r => m.set(r.record_id, r));
    return m;
  }, [artikel]);

  const auftraegeMap = useMemo(() => {
    const m = new Map<string, Auftraege>();
    auftraege.forEach(r => m.set(r.record_id, r));
    return m;
  }, [auftraege]);

  const lieferantenbestellungenMap = useMemo(() => {
    const m = new Map<string, Lieferantenbestellungen>();
    lieferantenbestellungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [lieferantenbestellungen]);

  const rechnungenMap = useMemo(() => {
    const m = new Map<string, Rechnungen>();
    rechnungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [rechnungen]);

  return { lieferanten, setLieferanten, kunden, setKunden, artikel, setArtikel, auftraege, setAuftraege, auftragspositionen, setAuftragspositionen, lieferantenbestellungen, setLieferantenbestellungen, bestellpositionen, setBestellpositionen, lagerbewegungen, setLagerbewegungen, rechnungen, setRechnungen, zahlungseingaenge, setZahlungseingaenge, loading, error, fetchAll, lieferantenMap, kundenMap, artikelMap, auftraegeMap, lieferantenbestellungenMap, rechnungenMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;