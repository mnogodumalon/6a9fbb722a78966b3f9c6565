import type { Lieferantenbestellungen, Lieferanten, Bestellpositionen, Lagerbewegungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface LieferantenbestellungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Lieferantenbestellungen;
  /** N:1-Ziel „Lieferanten": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  lieferantenList: Lieferanten[];
  /** Klick auf die Lieferanten-Relation → overlay.push auf dessen Detail. */
  onOpenLieferanten?: (record: Lieferanten) => void;
  /** 1:N „Bestellpositionen" (bestellung): VOLLE Liste — der Block filtert auf diesen Record. */
  bestellpositionenList: Bestellpositionen[];
  /** Zeilen-Klick → overlay.push auf das Bestellpositionen-Detail (nie der Edit-Dialog). */
  onOpenBestellpositionen: (record: Bestellpositionen) => void;
  /** Kontextuelles „+": öffnet den Bestellpositionen-Dialog mit diesem Record vorgesetzt. */
  onAddBestellpositionen: () => void;
  /** 1:N „Lagerbewegungen" (bestellung): VOLLE Liste — der Block filtert auf diesen Record. */
  lagerbewegungenList: Lagerbewegungen[];
  /** Zeilen-Klick → overlay.push auf das Lagerbewegungen-Detail (nie der Edit-Dialog). */
  onOpenLagerbewegungen: (record: Lagerbewegungen) => void;
  /** Kontextuelles „+": öffnet den Lagerbewegungen-Dialog mit diesem Record vorgesetzt. */
  onAddLagerbewegungen: () => void;
}

export function LieferantenbestellungenDetails({
  record,
  lieferantenList,
  onOpenLieferanten,
  bestellpositionenList,
  onOpenBestellpositionen,
  onAddBestellpositionen,
  lagerbewegungenList,
  onOpenLagerbewegungen,
  onAddLagerbewegungen,
}: LieferantenbestellungenDetailsProps) {
  const lieferantTarget = lieferantenList.find(r => r.record_id === extractRecordId(record.fields.lieferant));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('lieferantenbestellungen', 'bestellnummer')} value={record.fields.bestellnummer} format="text" />
        <RecordField label={fieldLabel('lieferantenbestellungen', 'bestelldatum')} value={record.fields.bestelldatum} format="date" />
        <RecordField label={fieldLabel('lieferantenbestellungen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('lieferantenbestellungen', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('lieferantenbestellungen', 'lieferant')}
          name={lieferantTarget?.fields.firmenname ?? '—'}
          meta={[lieferantTarget?.fields.email, lieferantTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={lieferantTarget && onOpenLieferanten ? () => onOpenLieferanten!(lieferantTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('bestellpositionen')}
        items={bestellpositionenList.filter(r => extractRecordId(r.fields.bestellung) === record.record_id)}
        map={() => ({ name: appLabel('bestellpositionen'), meta: undefined })}
        onOpen={onOpenBestellpositionen}
        onAdd={onAddBestellpositionen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('lagerbewegungen')}
        items={lagerbewegungenList.filter(r => extractRecordId(r.fields.bestellung) === record.record_id)}
        map={r => ({ name: appLabel('lagerbewegungen'), meta: r.fields.datum })}
        onOpen={onOpenLagerbewegungen}
        onAdd={onAddLagerbewegungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.LIEFERANTENBESTELLUNGEN} recordId={record.record_id} />
    </>
  );
}
