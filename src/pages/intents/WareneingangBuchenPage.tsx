/**
 * Wareneingang buchen — 4-Schritt-Wizard.
 * Steps: 1) Bestellung wählen → 2) Positionen erfassen → 3) Zusammenfassung → 4) Erfolg.
 * Reads: lieferantenbestellungen (offen/bestellt), bestellpositionen, artikel (via refs).
 * Writes: lagerbewegungen (N × wareneingang), lieferantenbestellungen (status → eingegangen).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, StepNav, SummaryStep, SuccessStep.
 */
import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Field } from '@/components/blocks/Field';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import { DatePicker } from '@/components/DatePicker';
import { Input } from '@/components/ui/input';
import {
  useRecordSearch,
  useStepForm,
  useJourneySubmit,
  fieldText,
  fieldLookup,
  fieldNumber,
  fieldRef,
  refFilter,
  todayIso,
  combineFilters,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';
import type { JourneyRecord } from '@/lib/journey';

// Per-position state: tatsaechliche Menge
interface PositionEntry {
  record: JourneyRecord;
  artikelId: string | null;
  artikelName: string;
  bestellteMenge: number;
  einkaufspreis: number | null;
  tatsaechlicheMenge: string; // string for input binding
}

const DRAFT_KEY = 'wareneingang-buchen';

export default function WareneingangBuchenPage() {
  const [step, setStep] = useState(1);

  // Step 1: pick a Lieferantenbestellung (status offen or bestellt)
  const bestellungen = useRecordSearch(servicePort, 'lieferantenbestellungen', {
    searchFields: ['bestellnummer', 'bemerkung'],
    filter: "r.v_status in ['offen', 'bestellt']",
    where: r => {
      const key = fieldLookup(r, 'status')?.key;
      return key === 'offen' || key === 'bestellt';
    },
    orderby: ['r.v_bestelldatum desc'],
    toItem: (b, ctx) => ({
      id: b.id,
      title: fieldText(b, 'bestellnummer'),
      subtitle: ctx.ref('lieferant'),
      status: fieldLookup(b, 'status') ?? undefined,
    }),
  });

  // Step form for capturing the common date across all positions
  const datumForm = useStepForm('lagerbewegungen', {
    fields: ['datum'],
    steps: { datum: 2 },
    initial: { datum: todayIso() },
    required: { artikel: false, menge: false, bewegungstyp: false, bestellung: false },
  });

  // Selected Bestellung id and its record
  const [selectedBestellungId, setSelectedBestellungId] = useState<string | null>(null);

  // Step 2: load Bestellpositionen for selected Bestellung
  const bestellpositionen = useRecordSearch(servicePort, 'bestellpositionen', {
    searchFields: [],
    filter: selectedBestellungId
      ? combineFilters(refFilter('bestellung', selectedBestellungId))
      : tx('r.id == "none"'),
    where: r => fieldRef(r, 'bestellung') === selectedBestellungId,
  });

  // Per-position quantity entries (built when positions load)
  const [positions, setPositions] = useState<PositionEntry[]>([]);
  const [positionsReady, setPositionsReady] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  // Summe bereits eingegangener Mengen pro Artikel (aus früheren Wareneingängen)
  const [prevMengenMap, setPrevMengenMap] = useState<Map<string, number>>(new Map());

  // Build position entries when bestellpositionen loads and step 2 is active
  const buildPositions = useCallback(async () => {
    if (!selectedBestellungId) return;
    setPositionsReady(false);
    setPositionsError(null);
    try {
      const records = bestellpositionen.records;
      const entries: PositionEntry[] = await Promise.all(
        records.map(async (pos) => {
          const artikelId = fieldRef(pos, 'artikel');
          let artikelName = tx('Unbekannter Artikel');
          if (artikelId) {
            const artikelRecord = await servicePort.get('artikel', artikelId);
            if (artikelRecord) {
              artikelName =
                fieldText(artikelRecord, 'bezeichnung') ||
                fieldText(artikelRecord, 'artikelnummer') ||
                artikelId;
            }
          }
          return {
            record: pos,
            artikelId,
            artikelName,
            bestellteMenge: fieldNumber(pos, 'menge') ?? 0,
            einkaufspreis: fieldNumber(pos, 'einkaufspreis'),
            tatsaechlicheMenge: String(fieldNumber(pos, 'menge') ?? 0),
          };
        })
      );
      // Bereits eingegangene Mengen laden, um Vollständigkeit prüfen zu können
      const existingBewegungen = await servicePort.list('lagerbewegungen', {
        filter: combineFilters(refFilter('bestellung', selectedBestellungId)),
      });
      const prevMap = new Map<string, number>();
      for (const bew of existingBewegungen) {
        const artId = fieldRef(bew, 'artikel');
        if (artId) {
          prevMap.set(artId, (prevMap.get(artId) ?? 0) + (fieldNumber(bew, 'menge') ?? 0));
        }
      }
      setPrevMengenMap(prevMap);
      setPositions(entries);
      setPositionsReady(true);
    } catch {
      setPositionsError(tx('Fehler beim Laden der Bestellpositionen.'));
      setPositionsReady(true);
    }
  }, [selectedBestellungId, bestellpositionen.records]);

  // Track whether positions have been loaded for the current selection
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);

  // When step 2 is active and positions haven't been loaded yet, load them
  const handleGoToStep2 = useCallback(async () => {
    if (lastLoadedId !== selectedBestellungId) {
      setLastLoadedId(selectedBestellungId);
      await bestellpositionen.reload();
      await buildPositions();
    }
  }, [selectedBestellungId, lastLoadedId, bestellpositionen, buildPositions]);

  // Menge update helper
  const updateMenge = (idx: number, value: string) => {
    setPositions(prev =>
      prev.map((p, i) => (i === idx ? { ...p, tatsaechlicheMenge: value } : p))
    );
  };

  // Active positions (menge > 0) for the plan
  const activePositions = positions.filter(p => {
    const n = parseFloat(p.tatsaechlicheMenge);
    return !isNaN(n) && n > 0 && p.artikelId;
  });

  // Neuer Bestellstatus: 'eingegangen' nur wenn alle Positionen vollständig eingegangen sind
  const newBestellungStatus = useMemo(() => {
    if (positions.length === 0) return 'eingegangen' as const;
    for (const pos of positions) {
      if (!pos.artikelId) continue;
      const prev = prevMengenMap.get(pos.artikelId) ?? 0;
      const neuEntry = activePositions.find(ap => ap.artikelId === pos.artikelId);
      const neuMenge = neuEntry ? (parseFloat(neuEntry.tatsaechlicheMenge) || 0) : 0;
      if (prev + neuMenge < pos.bestellteMenge) return 'bestellt' as const;
    }
    return 'eingegangen' as const;
  }, [positions, prevMengenMap, activePositions]);

  // Validation for step 2
  const validateStep2 = () => {
    if (!datumForm.validate(['datum'])) return false;
    if (activePositions.length === 0) {
      return tx('Bitte gib für mindestens eine Position eine eingegangene Menge ein.');
    }
    return true;
  };

  // Build the plan: N lagerbewegungen + 1 update of the Bestellung status
  const eingangsdatum = datumForm.get('datum') as string | null;

  const plan = [
    ...activePositions.map(pos => ({
      key: `bewegung-${pos.artikelId}`,
      label: pos.artikelName,
      entity: 'lagerbewegungen' as const,
      values: {
        bewegungstyp: 'wareneingang',
        artikel: pos.artikelId!,
        menge: parseFloat(pos.tatsaechlicheMenge),
        datum: eingangsdatum ?? todayIso(),
        bestellung: selectedBestellungId!,
      },
    })),
    {
      key: 'status-update',
      entity: 'lieferantenbestellungen' as const,
      updates: selectedBestellungId ?? '',
      values: { status: newBestellungStatus },
      verb: 'update' as const,
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: DRAFT_KEY });

  const bestellungRecord = selectedBestellungId
    ? bestellungen.recordOf(selectedBestellungId)
    : undefined;
  const bestellnummer = bestellungRecord
    ? fieldText(bestellungRecord, 'bestellnummer')
    : selectedBestellungId ?? '';
  const lieferantLabel = bestellungRecord
    ? (bestellungen.refLabel(bestellungRecord, 'lieferant') ?? '')
    : '';

  // Summary items for the review step
  const summaryItems = [
    {
      key: 'bestellnummer',
      label: tx('Bestellnummer'),
      value: bestellnummer,
    },
    {
      key: 'lieferant',
      label: tx('Lieferant'),
      value: lieferantLabel,
    },
    {
      key: 'eingangsdatum',
      label: tx('Eingangsdatum'),
      value: eingangsdatum
        ? format(new Date(eingangsdatum + 'T00:00:00'), 'dd.MM.yyyy')
        : '—',
      step: 2,
      keys: ['datum'],
    },
    ...activePositions.map(pos => ({
      key: `pos-${pos.artikelId}`,
      label: pos.artikelName,
      value: `${pos.tatsaechlicheMenge} ${pos.bestellteMenge > 0 ? tx`(bestellt: ${pos.bestellteMenge})` : ''}`.trim(),
    })),
  ];

  const handleRestart = () => {
    submit.reset();
    datumForm.reset({ datum: todayIso() });
    setSelectedBestellungId(null);
    setPositions([]);
    setPositionsReady(false);
    setLastLoadedId(null);
    setPrevMengenMap(new Map());
    setStep(1);
  };

  return (
    <IntentWizardShell
      title={tx('Wareneingang buchen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[datumForm]}
      draftKey={DRAFT_KEY}
      intro={{
        description: tx('Einen Wareneingang zur offenen Bestellung erfassen und Lagerbewegungen anlegen.'),
        needs: [tx('Bestellnummer'), tx('Eingangsdatum'), tx('Eingegangene Mengen')],
      }}
    >
      {/* Step 1: Bestellung wählen */}
      <WizardStep
        label={tx('Bestellung')}
        description={tx('Eine offene oder bestellte Lieferantenbestellung auswählen.')}
      >
        <EntitySelectStep
          {...bestellungen.select}
          selectedId={selectedBestellungId}
          emptyText={tx('Keine offenen Bestellungen vorhanden.')}
          create={false}
          searchPlaceholder={tx('Bestellnummer oder Bemerkung …')}
          onSelect={id => {
            setSelectedBestellungId(id);
            setPositions([]);
            setPositionsReady(false);
            setLastLoadedId(null);
            setPrevMengenMap(new Map());
          }}
        />
        {selectedBestellungId && (
          <StepNav
            hideBack
            onNext={async () => {
              await handleGoToStep2();
              setStep(2);
            }}
            nextStepLabel={tx('Positionen')}
          />
        )}
      </WizardStep>

      {/* Step 2: Positionen erfassen */}
      <WizardStep
        label={tx('Positionen')}
        description={tx('Eingegangene Menge für jeden Artikel eintragen. Positionen mit Menge 0 werden übersprungen.')}
        needs={['datum']}
      >
        {!selectedBestellungId ? (
          <StepNav
            onBack={() => setStep(1)}
            nextDisabled
          >
            {tx('Bitte zuerst eine Bestellung wählen.')}
          </StepNav>
        ) : (
          <div className="space-y-6">
            {/* Common date for all positions */}
            <Field form={datumForm} name="datum" label={tx('Eingangsdatum')}>
              <DatePicker {...datumForm.date('datum')} />
            </Field>

            {/* Position list */}
            {!positionsReady ? (
              <p className="text-sm text-muted-foreground">{tx('Positionen werden geladen …')}</p>
            ) : positionsError ? (
              <p className="text-sm text-destructive">{positionsError}</p>
            ) : positions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {tx('Diese Bestellung hat keine Positionen.')}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">{tx('Artikel und eingegangene Mengen')}</p>
                {positions.map((pos, idx) => (
                  <div
                    key={pos.record.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{pos.artikelName}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx('Bestellt')}: {pos.bestellteMenge}
                        {pos.einkaufspreis != null && (
                          <> · {tx('Einkaufspreis')}: {pos.einkaufspreis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor={`menge-${idx}`}
                        className="text-sm text-muted-foreground whitespace-nowrap"
                      >
                        {tx('Eingegangen')}
                      </label>
                      <Input
                        id={`menge-${idx}`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={pos.tatsaechlicheMenge}
                        onChange={e => updateMenge(idx, e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status indicator for active positions */}
            {positionsReady && positions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {activePositions.length === 0
                  ? tx('Keine Position hat eine Menge > 0.')
                  : tx`${activePositions.length} Position(en) werden gebucht.`}
              </p>
            )}

            <StepNav
              onBack={() => setStep(1)}
              onNext={validateStep2}
              nextStepLabel={tx('Zusammenfassung')}
            />
          </div>
        )}
      </WizardStep>

      {/* Step 3: Zusammenfassung */}
      <WizardStep label={tx('Zusammenfassung')}>
        {!selectedBestellungId ? (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Bitte zuerst eine Bestellung wählen.')}
          </StepNav>
        ) : !submit.done ? (
          <div className="space-y-4">
            {/* Bestellung context */}
            <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{bestellnummer}</p>
                {lieferantLabel && (
                  <p className="text-sm text-muted-foreground">{lieferantLabel}</p>
                )}
              </div>
              {bestellungRecord && (
                <StatusBadge
                  statusKey={fieldLookup(bestellungRecord, 'status')?.key}
                  label={fieldLookup(bestellungRecord, 'status')?.label}
                />
              )}
            </div>

            <SummaryStep
              forms={[datumForm]}
              submit={submit}
              items={summaryItems}
              whatHappensNext={tx('Für jede Position wird eine Lagerbewegung (Wareneingang) angelegt. Die Bestellung wird auf „Eingegangen" gesetzt, sobald alle Mengen vollständig eingegangen sind — andernfalls bleibt sie auf „Bestellt".')}
            />
          </div>
        ) : null}
      </WizardStep>

      {/* Success */}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[datumForm]}
          facts={[
            { label: tx('Bestellnummer'), value: bestellnummer },
            { label: tx('Lieferant'), value: lieferantLabel },
            { label: tx('Eingangsdatum'), value: eingangsdatum ? format(new Date(eingangsdatum + 'T00:00:00'), 'dd.MM.yyyy') : '—' },
            { label: tx('Gebuchte Positionen'), value: String(activePositions.length) },
          ]}
          whatHappensNext={tx('Die Bewegungen sind gebucht — der Lagerbestand wird in Kürze nachgeführt.')}
          next={[
            { label: tx('Weiteren Wareneingang buchen'), onClick: handleRestart },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          verb="created"
        />
      )}
    </IntentWizardShell>
  );
}
