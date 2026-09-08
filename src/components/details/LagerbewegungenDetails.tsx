import type { Lagerbewegungen, Artikel, Auftraege, Lieferantenbestellungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface LagerbewegungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Lagerbewegungen;
  /** N:1-Ziel „Artikel": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  artikelList: Artikel[];
  /** Klick auf die Artikel-Relation → overlay.push auf dessen Detail. */
  onOpenArtikel?: (record: Artikel) => void;
  /** N:1-Ziel „Auftraege": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  auftraegeList: Auftraege[];
  /** Klick auf die Auftraege-Relation → overlay.push auf dessen Detail. */
  onOpenAuftraege?: (record: Auftraege) => void;
  /** N:1-Ziel „Lieferantenbestellungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  lieferantenbestellungenList: Lieferantenbestellungen[];
  /** Klick auf die Lieferantenbestellungen-Relation → overlay.push auf dessen Detail. */
  onOpenLieferantenbestellungen?: (record: Lieferantenbestellungen) => void;
}

export function LagerbewegungenDetails({
  record,
  artikelList,
  onOpenArtikel,
  auftraegeList,
  onOpenAuftraege,
  lieferantenbestellungenList,
  onOpenLieferantenbestellungen,
}: LagerbewegungenDetailsProps) {
  const artikelTarget = artikelList.find(r => r.record_id === extractRecordId(record.fields.artikel));
  const auftragTarget = auftraegeList.find(r => r.record_id === extractRecordId(record.fields.auftrag));
  const bestellungTarget = lieferantenbestellungenList.find(r => r.record_id === extractRecordId(record.fields.bestellung));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('lagerbewegungen', 'bewegungstyp')} value={record.fields.bewegungstyp} format="pill" />
        <RecordField label={fieldLabel('lagerbewegungen', 'menge')} value={record.fields.menge} format="text" />
        <RecordField label={fieldLabel('lagerbewegungen', 'datum')} value={record.fields.datum} format="date" />
        <RecordField label={fieldLabel('lagerbewegungen', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('lagerbewegungen', 'artikel')}
          name={artikelTarget?.fields.artikelnummer ?? '—'}
          meta={[artikelTarget?.fields.bezeichnung].filter(Boolean).join(' · ') || undefined}
          onClick={artikelTarget && onOpenArtikel ? () => onOpenArtikel!(artikelTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('lagerbewegungen', 'auftrag')}
          name={auftragTarget?.fields.auftragsnummer ?? '—'}
          meta={undefined}
          onClick={auftragTarget && onOpenAuftraege ? () => onOpenAuftraege!(auftragTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('lagerbewegungen', 'bestellung')}
          name={bestellungTarget?.fields.bestellnummer ?? '—'}
          meta={undefined}
          onClick={bestellungTarget && onOpenLieferantenbestellungen ? () => onOpenLieferantenbestellungen!(bestellungTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.LAGERBEWEGUNGEN} recordId={record.record_id} />
    </>
  );
}
