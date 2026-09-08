import type { Bestellpositionen, Lieferantenbestellungen, Artikel } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface BestellpositionenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Bestellpositionen;
  /** N:1-Ziel „Lieferantenbestellungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  lieferantenbestellungenList: Lieferantenbestellungen[];
  /** Klick auf die Lieferantenbestellungen-Relation → overlay.push auf dessen Detail. */
  onOpenLieferantenbestellungen?: (record: Lieferantenbestellungen) => void;
  /** N:1-Ziel „Artikel": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  artikelList: Artikel[];
  /** Klick auf die Artikel-Relation → overlay.push auf dessen Detail. */
  onOpenArtikel?: (record: Artikel) => void;
}

export function BestellpositionenDetails({
  record,
  lieferantenbestellungenList,
  onOpenLieferantenbestellungen,
  artikelList,
  onOpenArtikel,
}: BestellpositionenDetailsProps) {
  const bestellungTarget = lieferantenbestellungenList.find(r => r.record_id === extractRecordId(record.fields.bestellung));
  const artikelTarget = artikelList.find(r => r.record_id === extractRecordId(record.fields.artikel));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('bestellpositionen', 'menge')} value={record.fields.menge} format="text" />
        <RecordField label={fieldLabel('bestellpositionen', 'einkaufspreis')} value={record.fields.einkaufspreis} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('bestellpositionen', 'bestellung')}
          name={bestellungTarget?.fields.bestellnummer ?? '—'}
          meta={undefined}
          onClick={bestellungTarget && onOpenLieferantenbestellungen ? () => onOpenLieferantenbestellungen!(bestellungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('bestellpositionen', 'artikel')}
          name={artikelTarget?.fields.artikelnummer ?? '—'}
          meta={[artikelTarget?.fields.bezeichnung].filter(Boolean).join(' · ') || undefined}
          onClick={artikelTarget && onOpenArtikel ? () => onOpenArtikel!(artikelTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.BESTELLPOSITIONEN} recordId={record.record_id} />
    </>
  );
}
