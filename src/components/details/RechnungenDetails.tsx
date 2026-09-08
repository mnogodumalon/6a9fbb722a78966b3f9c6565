import type { Rechnungen, Auftraege, Zahlungseingaenge } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface RechnungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Rechnungen;
  /** N:1-Ziel „Auftraege": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  auftraegeList: Auftraege[];
  /** Klick auf die Auftraege-Relation → overlay.push auf dessen Detail. */
  onOpenAuftraege?: (record: Auftraege) => void;
  /** 1:N „Zahlungseingänge" (rechnung): VOLLE Liste — der Block filtert auf diesen Record. */
  zahlungseingaengeList: Zahlungseingaenge[];
  /** Zeilen-Klick → overlay.push auf das Zahlungseingaenge-Detail (nie der Edit-Dialog). */
  onOpenZahlungseingaenge: (record: Zahlungseingaenge) => void;
  /** Kontextuelles „+": öffnet den Zahlungseingaenge-Dialog mit diesem Record vorgesetzt. */
  onAddZahlungseingaenge: () => void;
}

export function RechnungenDetails({
  record,
  auftraegeList,
  onOpenAuftraege,
  zahlungseingaengeList,
  onOpenZahlungseingaenge,
  onAddZahlungseingaenge,
}: RechnungenDetailsProps) {
  const auftragTarget = auftraegeList.find(r => r.record_id === extractRecordId(record.fields.auftrag));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('rechnungen', 'rechnungsnummer')} value={record.fields.rechnungsnummer} format="text" />
        <RecordField label={fieldLabel('rechnungen', 'rechnungsdatum')} value={record.fields.rechnungsdatum} format="date" />
        <RecordField label={fieldLabel('rechnungen', 'faelligkeitsdatum')} value={record.fields.faelligkeitsdatum} format="date" />
        <RecordField label={fieldLabel('rechnungen', 'nettobetrag')} value={record.fields.nettobetrag} format="text" />
        <RecordField label={fieldLabel('rechnungen', 'mehrwertsteuerbetrag')} value={record.fields.mehrwertsteuerbetrag} format="text" />
        <RecordField label={fieldLabel('rechnungen', 'bruttobetrag')} value={record.fields.bruttobetrag} format="text" />
        <RecordField label={fieldLabel('rechnungen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('rechnungen', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('rechnungen', 'auftrag')}
          name={auftragTarget?.fields.auftragsnummer ?? '—'}
          meta={undefined}
          onClick={auftragTarget && onOpenAuftraege ? () => onOpenAuftraege!(auftragTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('zahlungseingaenge')}
        items={zahlungseingaengeList.filter(r => extractRecordId(r.fields.rechnung) === record.record_id)}
        map={r => ({ name: appLabel('zahlungseingaenge'), meta: r.fields.zahlungsdatum })}
        onOpen={onOpenZahlungseingaenge}
        onAdd={onAddZahlungseingaenge}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.RECHNUNGEN} recordId={record.record_id} />
    </>
  );
}
