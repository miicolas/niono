import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import {
  type Csv,
  csvArchive,
} from "@/routes/(application)/-lib/import/csv-archive";
import { parseImportFile } from "@/routes/(application)/-lib/import/parse-import-file";
import type { Archive } from "@/validators/transfer";
import { CsvPreviewTable } from "./csv-preview-table";

const EXTENSION = /\.[^.]+$/;
type ImportResult = { pageIds: string[]; warnings: string[] };
export function SettingsImportTab({
  workspaceId,
  onDone,
}: {
  workspaceId: string;
  onDone: (id: string) => Promise<void>;
}) {
  const nameId = useId();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [csv, setCsv] = useState<Csv | null>(null);
  const [name, setName] = useState("");
  const [importId, setImportId] = useState("");
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  async function choose(file: File) {
    setArchive(null);
    setCsv(null);
    setResult(null);
    setWarnings([]);
    setName(file.name.replace(EXTENSION, ""));
    setImportId(crypto.randomUUID());
    const parsed = await parseImportFile(file);
    setCsv(parsed.csv ?? null);
    setArchive(parsed.archive ?? null);
    setWarnings(parsed.warnings);
  }
  const confirm = async () => {
    setBusy(true);
    try {
      const bundle = archive ?? (csv ? csvArchive(csv, name) : null);
      if (!bundle) {
        return;
      }
      setArchive(bundle);
      setCsv(null);
      const imported = await orpcClient.transfer.import({
        workspaceId,
        importId,
        archive: bundle,
      });
      setResult(imported);
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  };
  const cancel = () => {
    setArchive(null);
    setCsv(null);
  };
  const firstPageId = result?.pageIds[0];
  return (
    <div className="panel-form">
      <p className="muted text-xs">
        Markdown, texte, CSV ou archive JSON DigiPM. Les imports créent de
        nouvelles pages ; les fichiers existants restent en place.
      </p>
      <Input
        accept=".md,.markdown,.txt,.json,.csv"
        aria-label="Fichier à importer"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            choose(file).catch(reportError);
          }
        }}
        type="file"
      />
      {csv && (
        <>
          <label htmlFor={nameId}>
            Nom de la base
            <Input
              id={nameId}
              maxLength={300}
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </label>
          <p className="muted text-xs">
            Aperçu : {csv.rows.length} lignes. La première colonne devient le
            titre de chaque page.
          </p>
          <CsvPreviewTable csv={csv} onChange={setCsv} />
        </>
      )}
      {archive && (
        <div className="version-preview">
          <strong>
            {archive.pages.length} pages · {archive.sources.length} bases ·{" "}
            {archive.assets.length} fichiers
          </strong>
          {archive.pages.slice(0, 10).map((p) => (
            <p className="mt-2 mb-0" key={p.id}>
              {p.icon} {p.title}
            </p>
          ))}
        </div>
      )}
      {warnings.map((w, i) => (
        <p className="muted text-xs" key={i}>
          {w}
        </p>
      ))}
      {result && (
        <>
          <p className="success-text">
            Import terminé : {result.pageIds.length} pages racines créées.
          </p>
          {result.warnings.map((w) => (
            <p className="muted text-xs" key={w}>
              {w}
            </p>
          ))}
          {firstPageId && (
            <Button onClick={() => onDone(firstPageId)}>
              Ouvrir les pages importées
            </Button>
          )}
        </>
      )}
      {!result && (archive || csv) && (
        <div className="flex gap-2">
          <Button disabled={busy} onClick={confirm}>
            {busy ? "Import en cours…" : "Confirmer l’import"}
          </Button>
          <Button disabled={busy} onClick={cancel} variant="outline">
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}
