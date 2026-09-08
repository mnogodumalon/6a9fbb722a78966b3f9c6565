import type { Auftragspositionen, Auftraege, Artikel } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface AuftragspositionenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Auftragspositionen;
  /** N:1-Ziel „Auftraege": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  auftraegeList: Auftraege[];
  /** Klick auf die Auftraege-Relation → overlay.push auf dessen Detail. */
  onOpenAuftraege?: (record: Auftraege) => void;
  /** N:1-Ziel „Artikel": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  artikelList: Artikel[];
  /** Klick auf die Artikel-Relation → overlay.push auf dessen Detail. */
  onOpenArtikel?: (record: Artikel) => void;
}

export function AuftragspositionenDetails({
  record,
  auftraegeList,
  onOpenAuftraege,
  artikelList,
  onOpenArtikel,
}: AuftragspositionenDetailsProps) {
  const auftragTarget = auftraegeList.find(r => r.record_id === extractRecordId(record.fields.auftrag));
  const artikelTarget = artikelList.find(r => r.record_id === extractRecordId(record.fields.artikel));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('auftragspositionen', 'menge')} value={record.fields.menge} format="text" />
        <RecordField label={fieldLabel('auftragspositionen', 'einzelpreis_netto')} value={record.fields.einzelpreis_netto} format="text" />
        <RecordField label={fieldLabel('auftragspositionen', 'mehrwertsteuersatz')} value={record.fields.mehrwertsteuersatz} format="pill" />
        <RecordField label={fieldLabel('auftragspositionen', 'positionsbetrag_netto')} value={record.fields.positionsbetrag_netto} format="text" />
        <RecordField label={fieldLabel('auftragspositionen', 'positionsbetrag_brutto')} value={record.fields.positionsbetrag_brutto} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('auftragspositionen', 'auftrag')}
          name={auftragTarget?.fields.auftragsnummer ?? '—'}
          meta={undefined}
          onClick={auftragTarget && onOpenAuftraege ? () => onOpenAuftraege!(auftragTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('auftragspositionen', 'artikel')}
          name={artikelTarget?.fields.artikelnummer ?? '—'}
          meta={[artikelTarget?.fields.bezeichnung].filter(Boolean).join(' · ') || undefined}
          onClick={artikelTarget && onOpenArtikel ? () => onOpenArtikel!(artikelTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.AUFTRAGSPOSITIONEN} recordId={record.record_id} />
    </>
  );
}
