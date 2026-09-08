import type { Zahlungseingaenge, Rechnungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface ZahlungseingaengeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Zahlungseingaenge;
  /** N:1-Ziel „Rechnungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  rechnungenList: Rechnungen[];
  /** Klick auf die Rechnungen-Relation → overlay.push auf dessen Detail. */
  onOpenRechnungen?: (record: Rechnungen) => void;
}

export function ZahlungseingaengeDetails({
  record,
  rechnungenList,
  onOpenRechnungen,
}: ZahlungseingaengeDetailsProps) {
  const rechnungTarget = rechnungenList.find(r => r.record_id === extractRecordId(record.fields.rechnung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('zahlungseingaenge', 'zahlungsbetrag')} value={record.fields.zahlungsbetrag} format="text" />
        <RecordField label={fieldLabel('zahlungseingaenge', 'zahlungsdatum')} value={record.fields.zahlungsdatum} format="date" />
        <RecordField label={fieldLabel('zahlungseingaenge', 'zahlungsart')} value={record.fields.zahlungsart} format="pill" />
        <RecordField label={fieldLabel('zahlungseingaenge', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('zahlungseingaenge', 'rechnung')}
          name={rechnungTarget?.fields.rechnungsnummer ?? '—'}
          meta={undefined}
          onClick={rechnungTarget && onOpenRechnungen ? () => onOpenRechnungen!(rechnungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ZAHLUNGSEINGAENGE} recordId={record.record_id} />
    </>
  );
}
