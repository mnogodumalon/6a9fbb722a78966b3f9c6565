/**
 * Neuer Auftrag — 4-Schritt-Wizard.
 * Steps: 1) Kunde wählen → 2) Auftragsdetails → 3) Positionen hinzufügen → 4) Prüfen & anlegen.
 * Reads: kunden, artikel. Writes: auftraege (createAuftraegeEntry), auftragspositionen (createAuftragspositionenEntry).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, StepNav, SummaryStep, SuccessStep,
 *           Field, Bound, BudgetTracker.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Field } from '@/components/blocks/Field';
import { Bound } from '@/components/blocks/Bound';
import { BudgetTracker } from '@/components/blocks/BudgetTracker';
import { useRecordSearch, useStepForm, useJourneySubmit, fieldNumber, fieldLookup, todayIso, optionsOf } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';
import { Input } from '@/components/ui/input';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { ChoiceGroup } from '@/components/blocks/ChoiceGroup';

// One position the user adds in step 3
interface Position {
  artikelId: string;
  artikelLabel: string;
  lagerbestand: number | null;
  menge: number;
  einzelpreis_netto: number;
  mehrwertsteuersatz: string; // 'mwst_7' | 'mwst_19'
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

function calcNetto(positionen: Position[]): number {
  return positionen.reduce((s, p) => s + p.menge * p.einzelpreis_netto, 0);
}

function calcMwst(positionen: Position[]): number {
  return positionen.reduce((s, p) => {
    const rate = p.mehrwertsteuersatz === 'mwst_7' ? 0.07 : 0.19;
    return s + p.menge * p.einzelpreis_netto * rate;
  }, 0);
}

function mwstLabel(key: string): string {
  return key === 'mwst_7' ? '7 %' : '19 %';
}

export default function NeuerAuftragPage() {
  const [step, setStep] = useState(1);

  // Step 1: Kunde wählen
  const kunden = useRecordSearch(servicePort, 'kunden', {
    searchFields: ['firmenname', 'ansprechpartner_vorname', 'ansprechpartner_nachname'],
    toItem: k => ({
      id: k.id,
      title: String(k.fields.firmenname ?? ''),
      subtitle: [k.fields.ansprechpartner_vorname, k.fields.ansprechpartner_nachname]
        .filter(Boolean)
        .join(' ') || undefined,
    }),
  });

  // Step 3: Artikel wählen (für das aktuelle Positions-Formular)
  const artikel = useRecordSearch(servicePort, 'artikel', {
    searchFields: ['artikelnummer', 'bezeichnung'],
    toItem: a => ({
      id: a.id,
      title: String(a.fields.bezeichnung ?? ''),
      subtitle: String(a.fields.artikelnummer ?? ''),
      stats: [
        { label: tx('Lagerbestand'), value: String(fieldNumber(a, 'lagerbestand') ?? '—') },
        { label: tx('VK-Preis'), value: fieldNumber(a, 'verkaufspreis') != null ? formatCurrency(fieldNumber(a, 'verkaufspreis')!) : '—' },
      ],
    }),
  });

  // Form for step 2 (Auftragsdetails)
  const auftrag = useStepForm('auftraege', {
    steps: {
      auftragsnummer: 2,
      auftragsdatum: 2,
      lieferdatum: 2,
      status: 2,
      bemerkung: 2,
      kunde: 1,
    },
    initial: {
      status: 'entwurf',
      auftragsdatum: todayIso(),
    },
  });

  // Positionen list (managed locally, then written in the plan)
  const [positionen, setPositionen] = useState<Position[]>([]);

  // Sub-state for the current position being added
  const [pickingArtikel, setPickingArtikel] = useState(false);
  const [currentPos, setCurrentPos] = useState<{
    artikelId: string;
    artikelLabel: string;
    lagerbestand: number | null;
    menge: string;
    einzelpreis_netto: string;
    mehrwertsteuersatz: string;
  } | null>(null);

  const netto = calcNetto(positionen);
  const mwst = calcMwst(positionen);
  const brutto = netto + mwst;

  // The plan: CREATE auftraege, then one step per position
  const submit = useJourneySubmit(servicePort, [
    {
      key: 'auftrag',
      entity: 'auftraege',
      form: auftrag,
      primary: true,
      values: (ctx) => {
        void ctx; // ctx not needed here but required by signature shape
        return {
          nettobetrag: round2(netto),
          mehrwertsteuerbetrag: round2(mwst),
          bruttobetrag: round2(brutto),
        };
      },
    },
    ...positionen.map((pos, i) => ({
      key: `position-${i}`,
      entity: 'auftragspositionen' as const,
      needs: ['auftrag'],
      link: { auftrag: 'auftrag' },
      values: {
        artikel: pos.artikelId,
        menge: pos.menge,
        einzelpreis_netto: pos.einzelpreis_netto,
        mehrwertsteuersatz: pos.mehrwertsteuersatz,
        positionsbetrag_netto: round2(pos.menge * pos.einzelpreis_netto),
        positionsbetrag_brutto: round2(pos.menge * pos.einzelpreis_netto * (pos.mehrwertsteuersatz === 'mwst_7' ? 1.07 : 1.19)),
      },
    })),
  ], { draftKey: 'neuer-auftrag' });

  const mwstOptions = optionsOf('artikel', 'mehrwertsteuersatz');

  function handleArtikelSelect(id: string) {
    const rec = artikel.recordOf(id);
    const lagerbestand = rec ? fieldNumber(rec, 'lagerbestand') : null;
    const vk = rec ? fieldNumber(rec, 'verkaufspreis') : null;
    const mwstKey = rec ? (fieldLookup(rec, 'mehrwertsteuersatz')?.key ?? 'mwst_19') : 'mwst_19';
    setCurrentPos({
      artikelId: id,
      artikelLabel: artikel.labelOf(id) ?? id,
      lagerbestand,
      menge: '1',
      einzelpreis_netto: vk != null ? String(vk) : '',
      mehrwertsteuersatz: mwstKey,
    });
    setPickingArtikel(false);
  }

  function addPosition() {
    if (!currentPos) return;
    const menge = parseFloat(currentPos.menge);
    const einzelpreis = parseFloat(currentPos.einzelpreis_netto);
    if (!currentPos.artikelId || isNaN(menge) || menge <= 0 || isNaN(einzelpreis) || einzelpreis < 0) return;
    setPositionen(prev => [...prev, {
      artikelId: currentPos.artikelId,
      artikelLabel: currentPos.artikelLabel,
      lagerbestand: currentPos.lagerbestand,
      menge,
      einzelpreis_netto: einzelpreis,
      mehrwertsteuersatz: currentPos.mehrwertsteuersatz,
    }]);
    setCurrentPos(null);
    setPickingArtikel(false);
  }

  function removePosition(i: number) {
    setPositionen(prev => prev.filter((_, j) => j !== i));
  }

  const summaryItems = [
    {
      key: 'positionen-anzahl',
      label: tx('Positionen'),
      value: String(positionen.length),
    },
    {
      key: 'netto',
      label: tx('Nettobetrag'),
      value: formatCurrency(netto),
    },
    {
      key: 'mwst',
      label: tx('Mehrwertsteuer'),
      value: formatCurrency(mwst),
    },
    {
      key: 'brutto',
      label: tx('Bruttobetrag'),
      value: formatCurrency(brutto),
    },
  ];

  return (
    <IntentWizardShell
      title={tx('Neuer Auftrag')}
      currentStep={step}
      onStepChange={setStep}
      forms={[auftrag]}
      draftKey="neuer-auftrag"
      intro={{
        description: tx('Einen neuen Kundenauftrag mit Kopfdaten und Positionen anlegen.'),
        needs: [tx('Kundendaten'), tx('Auftragsnummer'), tx('Artikel und Mengen')],
      }}
    >
      {/* Step 1: Kunde wählen */}
      <WizardStep
        label={tx('Kunde')}
        description={tx('Wähle den Kunden aus, für den der Auftrag angelegt wird.')}
      >
        <EntitySelectStep
          {...kunden.select}
          selectedId={auftrag.get('kunde') as string | undefined}
          onSelect={id => {
            auftrag.set('kunde', id, kunden.labelOf(id));
            setStep(2);
          }}
          searchPlaceholder={tx('Firmenname oder Ansprechpartner')}
          create={{ fields: ['firmenname', 'ansprechpartner_vorname', 'ansprechpartner_nachname', 'email'] }}
        />
      </WizardStep>

      {/* Step 2: Auftragsdetails */}
      <WizardStep
        label={tx('Auftragsdetails')}
        description={tx('Nummer, Datum und Status des Auftrags eingeben.')}
      >
        <div className="space-y-4">
          <Field form={auftrag} name="auftragsnummer">
            <Input {...auftrag.field('auftragsnummer')} placeholder={tx('z. B. AU-2026-001')} />
          </Field>
          <Bound form={auftrag} name="auftragsdatum" />
          <Bound form={auftrag} name="lieferdatum" label={tx('Gewünschtes Lieferdatum')} />
          <Field form={auftrag} name="status">
            <ChoiceGroup {...auftrag.choice('status')} />
          </Field>
          <Bound form={auftrag} name="bemerkung" rows={3} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => auftrag.validate(['auftragsnummer', 'auftragsdatum', 'status'])}
            nextStepLabel={tx('Positionen')}
          />
        </div>
      </WizardStep>

      {/* Step 3: Positionen */}
      <WizardStep
        label={tx('Positionen')}
        description={tx('Artikel, Menge und Preis für jede Auftragsposition erfassen.')}
        needs={['auftragsnummer']}
      >
        <div className="space-y-6">
          {/* Existing positions */}
          {positionen.length > 0 && (
            <div className="space-y-3">
              {positionen.map((pos, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pos.artikelLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      {pos.menge} × {formatCurrency(pos.einzelpreis_netto)} · {mwstLabel(pos.mehrwertsteuersatz)}
                    </p>
                    <p className="text-sm font-medium">{formatCurrency(pos.menge * pos.einzelpreis_netto)}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive"
                    onClick={() => removePosition(i)}
                    aria-label={tx('Position entfernen')}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}

              {/* Summenzeile */}
              <div className="rounded-lg border bg-secondary p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{tx('Netto')}</span>
                  <span>{formatCurrency(netto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{tx('MwSt.')}</span>
                  <span>{formatCurrency(mwst)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>{tx('Brutto')}</span>
                  <span>{formatCurrency(brutto)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Add position: pick artikel */}
          {pickingArtikel && !currentPos && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{tx('Artikel wählen')}</p>
              <EntitySelectStep
                {...artikel.select}
                onSelect={handleArtikelSelect}
                searchPlaceholder={tx('Artikelnummer oder Bezeichnung')}
                create={false}
                emptyText={tx('Kein Artikel gefunden.')}
              />
              <Button variant="outline" type="button" onClick={() => setPickingArtikel(false)}>
                {tx('Abbrechen')}
              </Button>
            </div>
          )}

          {/* Position details form */}
          {currentPos && (
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <p className="font-medium">{currentPos.artikelLabel}</p>

              {/* Lagerbestand warning */}
              {currentPos.lagerbestand != null && (
                <BudgetTracker
                  format="count"
                  unit={tx('Stück')}
                  budget={currentPos.lagerbestand}
                  booked={parseFloat(currentPos.menge) || 0}
                  label={tx('Lagerbestand')}
                  texts={{ booked: tx('Gewünscht'), remaining: tx('verfügbar'), over: tx('Menge überschreitet Lagerbestand') }}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="pos-menge">{tx('Menge')} *</label>
                  <Input
                    id="pos-menge"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={currentPos.menge}
                    onChange={e => setCurrentPos(p => p ? { ...p, menge: e.target.value } : null)}
                    required
                  />
                  {currentPos.lagerbestand != null && parseFloat(currentPos.menge) > currentPos.lagerbestand && (
                    <p className="text-xs text-destructive">{tx('Menge überschreitet den Lagerbestand.')}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="pos-preis">{tx('Einzelpreis netto (€)')}</label>
                  <Input
                    id="pos-preis"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={currentPos.einzelpreis_netto}
                    onChange={e => setCurrentPos(p => p ? { ...p, einzelpreis_netto: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{tx('Mehrwertsteuersatz')}</p>
                <ChoiceGroup
                  id="pos-mwst"
                  value={currentPos.mehrwertsteuersatz}
                  onChange={key => setCurrentPos(p => p ? { ...p, mehrwertsteuersatz: key ?? 'mwst_19' } : null)}
                  options={mwstOptions}
                />
              </div>

              {/* Positionsbetrag preview */}
              {parseFloat(currentPos.menge) > 0 && parseFloat(currentPos.einzelpreis_netto) >= 0 && (
                <p className="text-sm text-muted-foreground">
                  {tx('Positionsbetrag netto')}: <strong>{formatCurrency(parseFloat(currentPos.menge) * parseFloat(currentPos.einzelpreis_netto))}</strong>
                </p>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button type="button" onClick={addPosition}>
                  {tx('Position hinzufügen')}
                </Button>
                <Button variant="outline" type="button" onClick={() => { setCurrentPos(null); setPickingArtikel(false); }}>
                  {tx('Abbrechen')}
                </Button>
              </div>
            </div>
          )}

          {/* Add another position button */}
          {!pickingArtikel && !currentPos && (
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={() => setPickingArtikel(true)}
            >
              <IconPlus size={16} className="shrink-0 mr-1" />
              {tx('Weitere Position hinzufügen')}
            </Button>
          )}

          <StepNav
            onBack={() => setStep(2)}
            onNext={() => {
              if (positionen.length === 0) return tx('Bitte mindestens eine Position hinzufügen.');
            }}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      {/* Step 4: Zusammenfassung */}
      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep
            forms={[auftrag]}
            submit={submit}
            items={summaryItems}
            whatHappensNext={tx('Der Auftrag wird mit allen Positionen angelegt und erscheint sofort in der Auftragsliste.')}
            confirmLabel={tx('Auftrag anlegen')}
          />
        )}
      </WizardStep>

      {/* Success */}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[auftrag]}
          facts={[
            { label: tx('Positionen'), value: String(positionen.length) },
            { label: tx('Bruttobetrag'), value: formatCurrency(brutto) },
          ]}
          next={[
            { label: tx('Weiteren Auftrag anlegen'), onClick: () => { submit.reset(); auftrag.reset(); setPositionen([]); setStep(1); } },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Der nächste Schritt ist die Freigabe und anschließend die Lieferung.')}
        />
      )}
    </IntentWizardShell>
  );
}
