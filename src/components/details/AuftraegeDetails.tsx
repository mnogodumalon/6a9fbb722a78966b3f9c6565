import type { Auftraege, Kunden, Auftragspositionen, Lagerbewegungen, Rechnungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, tx, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

/** Trennt die Bemerkung in anzuzeigenden Text und System-Vermerke. */
function parseBemerkung(raw: string | null | undefined): {
  displayText: string;
  statuswechselHints: Array<{ date: string | null }>;
  kreditlimitHints: string[];
} {
  if (!raw) return { displayText: '', statuswechselHints: [], kreditlimitHints: [] };
  const displayLines: string[] = [];
  const statuswechselHints: Array<{ date: string | null }> = [];
  const kreditlimitHints: string[] = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    // [Systemstatus: ...] — vollständig ausblenden
    if (/^\[Systemstatus:/i.test(t)) continue;
    // [Kreditlimit: ...] — als rote Warnung extrahieren
    if (/^\[Kreditlimit:/i.test(t)) {
      kreditlimitHints.push(t.replace(/^\[Kreditlimit:\s*/i, '').replace(/\]$/, ''));
      continue;
    }
    // "Statuswechsel von ... war nicht erlaubt" — als Hinweis extrahieren
    if (/statuswechsel.*war nicht erlaubt/i.test(t)) {
      const dateMatch = t.match(/(\d{2}\.\d{2}\.\d{4})/);
      statuswechselHints.push({ date: dateMatch ? dateMatch[1] : null });
      continue;
    }
    displayLines.push(line);
  }
  return {
    displayText: displayLines.join('\n').trim(),
    statuswechselHints,
    kreditlimitHints,
  };
}

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
  const { displayText: bemerkungText, statuswechselHints, kreditlimitHints } = parseBemerkung(record.fields.bemerkung as string);
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
        {kreditlimitHints.length > 0 && (
          <div className="md:col-span-2 space-y-1">
            {kreditlimitHints.map((hint, i) => (
              <p key={i} className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5 font-medium">
                {tx('Kreditlimit überschritten')} — {hint}
              </p>
            ))}
          </div>
        )}
        <RecordField label={fieldLabel('auftraege', 'bemerkung')} value={bemerkungText || null} format="longtext" className="md:col-span-2" />
        {statuswechselHints.length > 0 && (
          <div className="md:col-span-2 space-y-1">
            {statuswechselHints.map((hint, i) => (
              <p key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                {hint.date
                  ? tx`Am ${hint.date} wurde ein nicht erlaubter Statuswechsel zurückgesetzt.`
                  : tx('Ein nicht erlaubter Statuswechsel wurde zurückgesetzt.')}
              </p>
            ))}
          </div>
        )}
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
