import type { Lieferanten, Artikel, Lieferantenbestellungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface LieferantenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Lieferanten;
  /** 1:N „Artikel" (lieferant): VOLLE Liste — der Block filtert auf diesen Record. */
  artikelList: Artikel[];
  /** Zeilen-Klick → overlay.push auf das Artikel-Detail (nie der Edit-Dialog). */
  onOpenArtikel: (record: Artikel) => void;
  /** Kontextuelles „+": öffnet den Artikel-Dialog mit diesem Record vorgesetzt. */
  onAddArtikel: () => void;
  /** 1:N „Lieferantenbestellungen" (lieferant): VOLLE Liste — der Block filtert auf diesen Record. */
  lieferantenbestellungenList: Lieferantenbestellungen[];
  /** Zeilen-Klick → overlay.push auf das Lieferantenbestellungen-Detail (nie der Edit-Dialog). */
  onOpenLieferantenbestellungen: (record: Lieferantenbestellungen) => void;
  /** Kontextuelles „+": öffnet den Lieferantenbestellungen-Dialog mit diesem Record vorgesetzt. */
  onAddLieferantenbestellungen: () => void;
}

export function LieferantenDetails({
  record,
  artikelList,
  onOpenArtikel,
  onAddArtikel,
  lieferantenbestellungenList,
  onOpenLieferantenbestellungen,
  onAddLieferantenbestellungen,
}: LieferantenDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('lieferanten', 'firmenname')} value={record.fields.firmenname} format="text" />
        <RecordField label={fieldLabel('lieferanten', 'ansprechpartner_vorname')} value={record.fields.ansprechpartner_vorname} format="text" />
        <RecordField label={fieldLabel('lieferanten', 'ansprechpartner_nachname')} value={record.fields.ansprechpartner_nachname} format="text" />
        <RecordField label={fieldLabel('lieferanten', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('lieferanten', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('lieferanten', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('lieferanten', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('lieferanten', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('lieferanten', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('lieferanten', 'website')} value={record.fields.website} format="url" />
        <RecordField label={fieldLabel('lieferanten', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('artikel')}
        items={artikelList.filter(r => extractRecordId(r.fields.lieferant) === record.record_id)}
        map={r => ({ name: r.fields.artikelnummer ?? appLabel('artikel'), meta: undefined })}
        onOpen={onOpenArtikel}
        onAdd={onAddArtikel}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('lieferantenbestellungen')}
        items={lieferantenbestellungenList.filter(r => extractRecordId(r.fields.lieferant) === record.record_id)}
        map={r => ({ name: r.fields.bestellnummer ?? appLabel('lieferantenbestellungen'), meta: r.fields.bestelldatum })}
        onOpen={onOpenLieferantenbestellungen}
        onAdd={onAddLieferantenbestellungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.LIEFERANTEN} recordId={record.record_id} />
    </>
  );
}
