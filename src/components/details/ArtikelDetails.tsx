import type { Artikel, Lieferanten, Auftragspositionen, Bestellpositionen, Lagerbewegungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface ArtikelDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Artikel;
  /** N:1-Ziel „Lieferanten": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  lieferantenList: Lieferanten[];
  /** Klick auf die Lieferanten-Relation → overlay.push auf dessen Detail. */
  onOpenLieferanten?: (record: Lieferanten) => void;
  /** 1:N „Auftragspositionen" (artikel): VOLLE Liste — der Block filtert auf diesen Record. */
  auftragspositionenList: Auftragspositionen[];
  /** Zeilen-Klick → overlay.push auf das Auftragspositionen-Detail (nie der Edit-Dialog). */
  onOpenAuftragspositionen: (record: Auftragspositionen) => void;
  /** Kontextuelles „+": öffnet den Auftragspositionen-Dialog mit diesem Record vorgesetzt. */
  onAddAuftragspositionen: () => void;
  /** 1:N „Bestellpositionen" (artikel): VOLLE Liste — der Block filtert auf diesen Record. */
  bestellpositionenList: Bestellpositionen[];
  /** Zeilen-Klick → overlay.push auf das Bestellpositionen-Detail (nie der Edit-Dialog). */
  onOpenBestellpositionen: (record: Bestellpositionen) => void;
  /** Kontextuelles „+": öffnet den Bestellpositionen-Dialog mit diesem Record vorgesetzt. */
  onAddBestellpositionen: () => void;
  /** 1:N „Lagerbewegungen" (artikel): VOLLE Liste — der Block filtert auf diesen Record. */
  lagerbewegungenList: Lagerbewegungen[];
  /** Zeilen-Klick → overlay.push auf das Lagerbewegungen-Detail (nie der Edit-Dialog). */
  onOpenLagerbewegungen: (record: Lagerbewegungen) => void;
  /** Kontextuelles „+": öffnet den Lagerbewegungen-Dialog mit diesem Record vorgesetzt. */
  onAddLagerbewegungen: () => void;
}

export function ArtikelDetails({
  record,
  lieferantenList,
  onOpenLieferanten,
  auftragspositionenList,
  onOpenAuftragspositionen,
  onAddAuftragspositionen,
  bestellpositionenList,
  onOpenBestellpositionen,
  onAddBestellpositionen,
  lagerbewegungenList,
  onOpenLagerbewegungen,
  onAddLagerbewegungen,
}: ArtikelDetailsProps) {
  const lieferantTarget = lieferantenList.find(r => r.record_id === extractRecordId(record.fields.lieferant));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('artikel', 'artikelnummer')} value={record.fields.artikelnummer} format="text" />
        <RecordField label={fieldLabel('artikel', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('artikel', 'einkaufspreis')} value={record.fields.einkaufspreis} format="text" />
        <RecordField label={fieldLabel('artikel', 'verkaufspreis')} value={record.fields.verkaufspreis} format="text" />
        <RecordField label={fieldLabel('artikel', 'mehrwertsteuersatz')} value={record.fields.mehrwertsteuersatz} format="pill" />
        <RecordField label={fieldLabel('artikel', 'lagerbestand')} value={record.fields.lagerbestand} format="text" />
        <RecordField label={fieldLabel('artikel', 'mindestbestand')} value={record.fields.mindestbestand} format="text" />
        <RecordField label={fieldLabel('artikel', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('artikel', 'lieferant')}
          name={lieferantTarget?.fields.firmenname ?? '—'}
          meta={[lieferantTarget?.fields.email, lieferantTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={lieferantTarget && onOpenLieferanten ? () => onOpenLieferanten!(lieferantTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('auftragspositionen')}
        items={auftragspositionenList.filter(r => extractRecordId(r.fields.artikel) === record.record_id)}
        map={() => ({ name: appLabel('auftragspositionen'), meta: undefined })}
        onOpen={onOpenAuftragspositionen}
        onAdd={onAddAuftragspositionen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('bestellpositionen')}
        items={bestellpositionenList.filter(r => extractRecordId(r.fields.artikel) === record.record_id)}
        map={() => ({ name: appLabel('bestellpositionen'), meta: undefined })}
        onOpen={onOpenBestellpositionen}
        onAdd={onAddBestellpositionen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('lagerbewegungen')}
        items={lagerbewegungenList.filter(r => extractRecordId(r.fields.artikel) === record.record_id)}
        map={r => ({ name: appLabel('lagerbewegungen'), meta: r.fields.datum })}
        onOpen={onOpenLagerbewegungen}
        onAdd={onAddLagerbewegungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ARTIKEL} recordId={record.record_id} />
    </>
  );
}
