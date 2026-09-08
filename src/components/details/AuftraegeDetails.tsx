import type { Auftraege, Kunden, Auftragspositionen, Lagerbewegungen, Rechnungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface AuftraegeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Auftraege;
  /** N:1-Ziel „Kunden": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenList: Kunden[];
  /** Klick auf die Kunden-Relation → overlay.push auf dessen Detail. */
  onOpenKunden?: (record: Kunden) => void;
  /** 1:N „Auftragspositionen" (auftrag): VOLLE Liste — der Block filtert auf diesen Record. */
  auftragspositionenList: Auftragspositionen[];
  /** Zeilen-Klick → overlay.push auf das Auftragspositionen-Detail (nie der Edit-Dialog). */
  onOpenAuftragspositionen: (record: Auftragspositionen) => void;
  /** Kontextuelles „+": öffnet den Auftragspositionen-Dialog mit diesem Record vorgesetzt. */
  onAddAuftragspositionen: () => void;
  /** 1:N „Lagerbewegungen" (auftrag): VOLLE Liste — der Block filtert auf diesen Record. */
  lagerbewegungenList: Lagerbewegungen[];
  /** Zeilen-Klick → overlay.push auf das Lagerbewegungen-Detail (nie der Edit-Dialog). */
  onOpenLagerbewegungen: (record: Lagerbewegungen) => void;
  /** Kontextuelles „+": öffnet den Lagerbewegungen-Dialog mit diesem Record vorgesetzt. */
  onAddLagerbewegungen: () => void;
  /** 1:N „Rechnungen" (auftrag): VOLLE Liste — der Block filtert auf diesen Record. */
  rechnungenList: Rechnungen[];
  /** Zeilen-Klick → overlay.push auf das Rechnungen-Detail (nie der Edit-Dialog). */
  onOpenRechnungen: (record: Rechnungen) => void;
  /** Kontextuelles „+": öffnet den Rechnungen-Dialog mit diesem Record vorgesetzt. */
  onAddRechnungen: () => void;
}

export function AuftraegeDetails({
  record,
  kundenList,
  onOpenKunden,
  auftragspositionenList,
  onOpenAuftragspositionen,
  onAddAuftragspositionen,
  lagerbewegungenList,
  onOpenLagerbewegungen,
  onAddLagerbewegungen,
  rechnungenList,
  onOpenRechnungen,
  onAddRechnungen,
}: AuftraegeDetailsProps) {
  const kundeTarget = kundenList.find(r => r.record_id === extractRecordId(record.fields.kunde));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('auftraege', 'auftragsnummer')} value={record.fields.auftragsnummer} format="text" />
        <RecordField label={fieldLabel('auftraege', 'auftragsdatum')} value={record.fields.auftragsdatum} format="date" />
        <RecordField label={fieldLabel('auftraege', 'lieferdatum')} value={record.fields.lieferdatum} format="date" />
        <RecordField label={fieldLabel('auftraege', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('auftraege', 'nettobetrag')} value={record.fields.nettobetrag} format="text" />
        <RecordField label={fieldLabel('auftraege', 'mehrwertsteuerbetrag')} value={record.fields.mehrwertsteuerbetrag} format="text" />
        <RecordField label={fieldLabel('auftraege', 'bruttobetrag')} value={record.fields.bruttobetrag} format="text" />
        <RecordField label={fieldLabel('auftraege', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('auftraege', 'kunde')}
          name={kundeTarget?.fields.firmenname ?? '—'}
          meta={[kundeTarget?.fields.email, kundeTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={kundeTarget && onOpenKunden ? () => onOpenKunden!(kundeTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('auftragspositionen')}
        items={auftragspositionenList.filter(r => extractRecordId(r.fields.auftrag) === record.record_id)}
        map={() => ({ name: appLabel('auftragspositionen'), meta: undefined })}
        onOpen={onOpenAuftragspositionen}
        onAdd={onAddAuftragspositionen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('lagerbewegungen')}
        items={lagerbewegungenList.filter(r => extractRecordId(r.fields.auftrag) === record.record_id)}
        map={r => ({ name: appLabel('lagerbewegungen'), meta: r.fields.datum })}
        onOpen={onOpenLagerbewegungen}
        onAdd={onAddLagerbewegungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('rechnungen')}
        items={rechnungenList.filter(r => extractRecordId(r.fields.auftrag) === record.record_id)}
        map={r => ({ name: r.fields.rechnungsnummer ?? appLabel('rechnungen'), meta: r.fields.rechnungsdatum })}
        onOpen={onOpenRechnungen}
        onAdd={onAddRechnungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.AUFTRAEGE} recordId={record.record_id} />
    </>
  );
}
