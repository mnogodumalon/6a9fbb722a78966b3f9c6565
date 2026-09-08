import { useMemo, useState } from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { tx, appLabel } from '@/i18n';
import { LOOKUP_OPTIONS, lookupOption, APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { formatDate, formatCurrency, lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { HeroBanner } from '@/components/HeroBanner';
import { WorkList } from '@/components/WorkList';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { KanbanWidget, type KanbanCard, type KanbanColumn, type KanbanTone } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';
import { IconAlertCircle, IconPackage, IconShoppingCart, IconCreditCard, IconTruck, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { EnrichedAuftraege, EnrichedRechnungen } from '@/types/enriched';

// Reihenfolge der Auftragsstatus für Vorwärts-Validierung
const STATUS_ORDER: Record<string, number> = {
  entwurf: 0, freigegeben: 1, geliefert: 2, abgerechnet: 3,
};

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    auftraege, artikel, rechnungen, zahlungseingaenge, fetchAll,
    setAuftraege, setRechnungen,
  } = data;

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'auftraege') {
        const r = top.record as EnrichedAuftraege;
        const current = lookupKey(r.fields.status);
        const next = current === 'entwurf' ? 'freigegeben'
          : current === 'freigegeben' ? 'geliefert'
          : current === 'geliefert' ? 'abgerechnet'
          : null;
        if (!next) return undefined;
        const nextLabel = next === 'freigegeben' ? tx('Freigeben')
          : next === 'geliefert' ? tx('Als geliefert markieren')
          : tx('Abrechnen');
        return {
          label: nextLabel,
          onClick: () => void advanceAuftrag(r, next),
        };
      }
      if (top.type === 'rechnungen') {
        const r = top.record as EnrichedRechnungen;
        if (lookupKey(r.fields.status) !== 'bezahlt') {
          return {
            label: tx('Als bezahlt markieren'),
            onClick: () => void markRechnungBezahlt(r),
          };
        }
      }
      return undefined;
    },
  });

  const enrichedAuftraege = crud.enriched.auftraege;
  const enrichedRechnungen = crud.enriched.rechnungen;
  const enrichedArtikel = crud.enriched.artikel;

  const clock = useClock();
  const todayStr = format(clock, 'yyyy-MM-dd');

  // --- Derived data ---

  // Artikel unter Mindestbestand
  const artikelUnterMindest = useMemo(
    () => enrichedArtikel.filter(a => {
      const bestand = a.fields.lagerbestand ?? 0;
      const mindest = a.fields.mindestbestand;
      return mindest != null && bestand < mindest;
    }),
    [enrichedArtikel],
  );

  // Überfällige Rechnungen (Status 'ueberfaellig' oder Fälligkeit überschritten + offen)
  const ueberfaelligeRechnungen = useMemo(
    () => enrichedRechnungen.filter(r => {
      const status = lookupKey(r.fields.status);
      if (status === 'ueberfaellig') return true;
      if (status === 'offen' && r.fields.faelligkeitsdatum && r.fields.faelligkeitsdatum < todayStr) return true;
      return false;
    }),
    [enrichedRechnungen, todayStr],
  );

  // Offene Rechnungen gesamt
  const offeneRechnungen = useMemo(
    () => enrichedRechnungen.filter(r => {
      const s = lookupKey(r.fields.status);
      return s === 'offen' || s === 'ueberfaellig';
    }),
    [enrichedRechnungen],
  );

  // Bereits erfasste Zahlungen pro Rechnung
  const zahlungenProRechnung = useMemo(() => {
    const m = new Map<string, number>();
    for (const z of zahlungseingaenge) {
      const rId = extractRecordId(z.fields.rechnung);
      if (rId) m.set(rId, (m.get(rId) ?? 0) + (z.fields.zahlungsbetrag ?? 0));
    }
    return m;
  }, [zahlungseingaenge]);

  // Offene Forderungen = Brutto minus bereits gebuchte Zahlungseingänge
  const offeneRechnungenSumme = useMemo(
    () => offeneRechnungen.reduce((sum, r) => {
      const paid = zahlungenProRechnung.get(r.record_id) ?? 0;
      return sum + Math.max(0, (r.fields.bruttobetrag ?? 0) - paid);
    }, 0),
    [offeneRechnungen, zahlungenProRechnung],
  );

  // Aufträge freigegeben (zur Lieferung bereit)
  const freigegebeneAuftraege = useMemo(
    () => enrichedAuftraege.filter(a => lookupKey(a.fields.status) === 'freigegeben'),
    [enrichedAuftraege],
  );

  // Offene Aufträge (Entwurf + Freigegeben)
  const offeneAuftraege = useMemo(
    () => enrichedAuftraege.filter(a => {
      const s = lookupKey(a.fields.status);
      return s === 'entwurf' || s === 'freigegeben';
    }),
    [enrichedAuftraege],
  );

  // Filter state für KPIs
  const [kpiFilter, setKpiFilter] = useState<'offen' | 'ueberfaellig' | null>(null);

  // --- Actions ---

  const advanceAuftrag = async (auftrag: EnrichedAuftraege, nextStatus: string) => {
    const prev = auftrag.fields.status;
    const optimistic = auftraege.map(a =>
      a.record_id === auftrag.record_id
        ? { ...a, fields: { ...a.fields, status: lookupOption('auftraege', 'status', nextStatus) } }
        : a,
    );
    setAuftraege(optimistic);
    const label = auftrag.fields.auftragsnummer ?? auftrag.kundeName;
    undoToast(tx`${label} — Status aktualisiert`, async () => {
      const revert = auftraege.map(a =>
        a.record_id === auftrag.record_id
          ? { ...a, fields: { ...a.fields, status: prev } }
          : a,
      );
      setAuftraege(revert);
      await LivingAppsService.updateAuftraegeEntry(auftrag.record_id, { status: lookupKey(prev) });
    });
    try {
      await LivingAppsService.updateAuftraegeEntry(auftrag.record_id, { status: nextStatus });
    } catch {
      await fetchAll();
    }
  };

  const markRechnungBezahlt = async (rechnung: EnrichedRechnungen) => {
    // Offener Restbetrag = Brutto minus bereits gebuchte Zahlungen
    const paid = zahlungenProRechnung.get(rechnung.record_id) ?? 0;
    const restbetrag = Math.max(0, (rechnung.fields.bruttobetrag ?? 0) - paid);

    const prev = rechnung.fields.status;
    const optimistic = rechnungen.map(r =>
      r.record_id === rechnung.record_id
        ? { ...r, fields: { ...r.fields, status: lookupOption('rechnungen', 'status', 'bezahlt') } }
        : r,
    );
    setRechnungen(optimistic);
    const label = rechnung.fields.rechnungsnummer ?? rechnung.auftragName;
    undoToast(tx`${label} — als bezahlt markiert`, async () => {
      const revert = rechnungen.map(r =>
        r.record_id === rechnung.record_id
          ? { ...r, fields: { ...r.fields, status: prev } }
          : r,
      );
      setRechnungen(revert);
      await LivingAppsService.updateRechnungenEntry(rechnung.record_id, { status: lookupKey(prev) });
    });
    try {
      // Zahlungseingang über den offenen Restbetrag anlegen
      if (restbetrag > 0) {
        await LivingAppsService.createZahlungseingaengeEntry({
          rechnung: createRecordUrl(APP_IDS.RECHNUNGEN, rechnung.record_id),
          zahlungsbetrag: restbetrag,
          zahlungsdatum: format(clock, 'yyyy-MM-dd'),
          zahlungsart: 'ueberweisung',
        });
      }
      await LivingAppsService.updateRechnungenEntry(rechnung.record_id, { status: 'bezahlt' });
    } catch {
      await fetchAll();
    }
  };

  // --- Kanban setup ---

  const COLUMNS = useMemo<KanbanColumn[]>(
    () => (LOOKUP_OPTIONS['auftraege']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label })),
    [],
  );

  function toneForStatus(status: string | undefined): KanbanTone {
    if (status === 'abgerechnet') return 'success';
    if (status === 'freigegeben') return 'primary';
    if (status === 'geliefert') return 'warning';
    if (status === 'storniert') return 'default';
    return 'default';
  }

  const cards = useMemo<KanbanCard[]>(
    () => enrichedAuftraege.map(a => {
      const status = lookupKey(a.fields.status) ?? COLUMNS[0]?.key ?? '';
      return {
        id: `auftrag:${a.record_id}`,
        column: status,
        title: a.kundeName || a.fields.auftragsnummer || tx('Unbekannt'),
        subtitle: a.fields.lieferdatum
          ? tx`Lieferung: ${formatDate(a.fields.lieferdatum)}`
          : a.fields.auftragsnummer,
        tone: toneForStatus(status),
      };
    }),
    [enrichedAuftraege, COLUMNS],
  );

  const moveCard = async (cardId: string, newColumn: string): Promise<string | void> => {
    const rid = cardId.split(':')[1];
    if (!rid) return;
    const auftrag = auftraege.find(a => a.record_id === rid);
    if (!auftrag) return;

    // Vorwärts-Regel: nur in Richtung der definierten Reihenfolge
    const fromStatus = lookupKey(auftrag.fields.status) ?? '';
    const fromOrder = STATUS_ORDER[fromStatus] ?? -1;
    const toOrder = STATUS_ORDER[newColumn] ?? -1;
    if (newColumn === 'storniert') {
      if (fromStatus !== 'entwurf' && fromStatus !== 'freigegeben') {
        return tx('Stornieren ist nur aus Entwurf oder Freigegeben möglich.');
      }
    } else if (toOrder !== -1 && fromOrder !== -1 && toOrder <= fromOrder) {
      return tx('Aufträge können nur vorwärts verschoben werden.');
    }

    const prev = auftrag.fields.status;
    setAuftraege(prev2 =>
      prev2.map(a =>
        a.record_id === rid
          ? { ...a, fields: { ...a.fields, status: lookupOption('auftraege', 'status', newColumn) } }
          : a,
      ),
    );
    const label = auftrag.fields.auftragsnummer ?? '';
    undoToast(tx`${label} — Status geändert`, async () => {
      setAuftraege(prev2 =>
        prev2.map(a =>
          a.record_id === rid
            ? { ...a, fields: { ...a.fields, status: prev } }
            : a,
        ),
      );
      await LivingAppsService.updateAuftraegeEntry(rid, { status: lookupKey(prev) });
    });
    try {
      await LivingAppsService.updateAuftraegeEntry(rid, { status: newColumn });
    } catch {
      await fetchAll();
    }
  };

  // --- ChartWidget rows: Umsatz pro Monat — nur Freigegeben/Geliefert/Abgerechnet ---
  const chartRows = useMemo<ChartRow<EnrichedAuftraege>[]>(
    () => enrichedAuftraege
      .filter(a => {
        const s = lookupKey(a.fields.status);
        return s === 'freigegeben' || s === 'geliefert' || s === 'abgerechnet';
      })
      .map(a => ({ id: `auftrag:${a.record_id}`, data: a })),
    [enrichedAuftraege],
  );

  // --- Context line ---
  const contextLine = useMemo(() => {
    if (ueberfaelligeRechnungen.length > 0) {
      const names = ueberfaelligeRechnungen.slice(0, 3).map(r => r.auftragName || r.fields.rechnungsnummer || '').filter(Boolean);
      return tx`${namen(names)} — ${ueberfaelligeRechnungen.length} überfällige Rechnungen erfordern Aufmerksamkeit.`;
    }
    if (freigegebeneAuftraege.length > 0) {
      const names = freigegebeneAuftraege.slice(0, 2).map(a => a.kundeName).filter(Boolean);
      return tx`${freigegebeneAuftraege.length} Aufträge zur Lieferung bereit — ${namen(names)}.`;
    }
    if (artikelUnterMindest.length > 0) {
      return tx`${artikelUnterMindest.length} Artikel unter Mindestbestand — Nachbestellung prüfen.`;
    }
    return tx('Alle Aufträge und Bestände im grünen Bereich.');
  }, [ueberfaelligeRechnungen, freigegebeneAuftraege, artikelUnterMindest]);

  // --- Empty state ---
  if (auftraege.length === 0 && artikel.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <IconShoppingCart size={48} className="text-primary" stroke={1.5} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">{tx('Willkommen bei GastroFlow!')}</h2>
          <p className="text-muted-foreground max-w-sm">{tx('Lege deinen ersten Auftrag an und manage deinen Großhandel — von der Bestellung bis zur Bezahlung.')}</p>
        </div>
        <Button onClick={() => crud.auftraege.openCreate({ status: 'entwurf' })}>
          <IconPlus size={16} className="shrink-0 mr-2" />
          {tx('Ersten Auftrag anlegen')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{gruss(clock)}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">{contextLine}</p>
        </div>
        <Button
          onClick={() => crud.auftraege.openCreate({ status: 'entwurf' })}
          className="shrink-0 self-start sm:self-auto"
        >
          <IconPlus size={16} className="shrink-0 mr-2" />
          {tx('Neuer Auftrag')}
        </Button>
      </div>

      <DashboardGrid
        variant="wide"
        hero={ueberfaelligeRechnungen.length > 0 ? (
          <HeroBanner
            icon={<IconAlertCircle size={18} />}
            action={{
              label: tx('Als bezahlt markieren'),
              onClick: () => void markRechnungBezahlt(ueberfaelligeRechnungen[0]),
            }}
          >
            <b>{namen(ueberfaelligeRechnungen.map(r => r.auftragName || r.fields.rechnungsnummer || '').filter(Boolean))}</b>
            {' '}{tx('— überfällig. Fällig war')}{' '}
            {formatDate(ueberfaelligeRechnungen[0].fields.faelligkeitsdatum)}.
          </HeroBanner>
        ) : undefined}
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Offene Aufträge')}
              value={offeneAuftraege.length}
              icon={<IconShoppingCart size={16} className="shrink-0" />}
              tone={offeneAuftraege.length > 0 ? 'primary' : 'default'}
              onClick={() => setKpiFilter(f => f === 'offen' ? null : 'offen')}
              active={kpiFilter === 'offen'}
            />
            <StatStripItem
              title={tx('Zur Lieferung')}
              value={freigegebeneAuftraege.length}
              icon={<IconTruck size={16} className="shrink-0" />}
              tone={freigegebeneAuftraege.length > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tx('Unter Mindestbestand')}
              value={artikelUnterMindest.length}
              icon={<IconPackage size={16} className="shrink-0" />}
              tone={artikelUnterMindest.length > 0 ? 'destructive' : 'default'}
            />
            <StatStripItem
              title={tx('Offene Forderungen')}
              value={formatCurrency(offeneRechnungenSumme)}
              icon={<IconCreditCard size={16} className="shrink-0" />}
              tone={ueberfaelligeRechnungen.length > 0 ? 'destructive' : offeneRechnungen.length > 0 ? 'warning' : 'default'}
              onClick={() => setKpiFilter(f => f === 'ueberfaellig' ? null : 'ueberfaellig')}
              active={kpiFilter === 'ueberfaellig'}
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            cards={kpiFilter === 'offen'
              ? cards.filter(c => c.column === 'entwurf' || c.column === 'freigegeben')
              : cards}
            columns={COLUMNS}
            defaultCollapsed={['storniert', 'abgerechnet']}
            onCardClick={card => {
              const rid = card.id.split(':')[1];
              const auftrag = enrichedAuftraege.find(a => a.record_id === rid);
              if (auftrag) crud.auftraege.openDetail(auftrag);
            }}
            onCardMove={moveCard}
            onAddCard={column => crud.auftraege.openCreate({ status: column })}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Zur Lieferung bereit')}
              items={freigegebeneAuftraege.slice(0, 6).map(a => ({
                id: a.record_id,
                title: a.kundeName || a.fields.auftragsnummer || tx('Unbekannt'),
                secondLine: (
                  <>
                    <span className="font-medium text-primary">{tx('Freigegeben')}</span>
                    {a.fields.lieferdatum && (
                      <span className="text-muted-foreground"> · {tx('Lieferung')}: {formatDate(a.fields.lieferdatum)}</span>
                    )}
                  </>
                ),
                action: {
                  label: tx('Geliefert'),
                  onClick: () => void advanceAuftrag(a, 'geliefert'),
                },
              }))}
              onItemClick={id => {
                const a = enrichedAuftraege.find(x => x.record_id === id);
                if (a) crud.auftraege.openDetail(a);
              }}
              empty={{
                text: tx('Keine freigegebenen Aufträge — alle Aufträge sind auf dem neuesten Stand.'),
                action: { label: tx('Neuer Auftrag'), onClick: () => crud.auftraege.openCreate({ status: 'freigegeben' }) },
              }}
            />

            <ChartWidget
              title={tx('Umsatz pro Monat')}
              rows={chartRows}
              dimension={{
                kind: 'time',
                accessor: row => row.data.fields.auftragsdatum ?? null,
                bucket: 'month',
              }}
              measure={{
                aggregate: 'sum',
                label: tx('Brutto'),
                value: row => row.data.fields.bruttobetrag ?? null,
                format: 'currency',
              }}
              timeEnd={format(clock, 'yyyy-MM-dd')}
            />
          </>
        }
      />

      {/* Artikel unter Mindestbestand — only when there are some */}
      {artikelUnterMindest.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {tx('Artikel unter Mindestbestand')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {artikelUnterMindest.slice(0, 8).map(a => (
              <button
                key={a.record_id}
                type="button"
                onClick={() => crud.artikel.openDetail(a)}
                className="text-left rounded-[13px] border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.fields.bezeichnung ?? a.fields.artikelnummer}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.fields.artikelnummer}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                    {a.fields.lagerbestand ?? 0} / {a.fields.mindestbestand}
                  </span>
                </div>
                {a.lieferantName && (
                  <p className="text-xs text-muted-foreground mt-1.5 truncate">{a.lieferantName}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {crud.surfaces}
    </div>
  );
}
