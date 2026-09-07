import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { propertyTypeLabels } from "@/features/database/property-types";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import type { PropertyType } from "@/validators/databases";
import type { Archive } from "@/validators/transfer";
import { type Csv, csvArchive, csvPropertyTypes } from "./csv-archive";
import { parseImportFile } from "./parse-import-file";
export function ImportPanel({
  workspaceId,
  onDone,
}: {
  workspaceId: string;
  onDone: (id: string) => Promise<void>;
}) {
  const [archive, setArchive] = useState<Archive | null>(null);
  const [csv, setCsv] = useState<Csv | null>(null);
  const [name, setName] = useState("");
  const [importId, setImportId] = useState("");
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<{
    pageIds: string[];
    warnings: string[];
  } | null>(null);
  async function choose(file: File) {
    setArchive(null);
    setCsv(null);
    setResult(null);
    setWarnings([]);
    setName(file.name.replace(/\.[^.]+$/, ""));
    setImportId(crypto.randomUUID());
    const parsed = await parseImportFile(file);
    setCsv(parsed.csv ?? null);
    setArchive(parsed.archive ?? null);
    setWarnings(parsed.warnings);
  }
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
            void choose(file).catch(reportError);
          }
        }}
        type="file"
      />
      {csv && (
        <>
          <label>
            Nom de la base
            <Input
              maxLength={300}
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </label>
          <p className="muted text-xs">
            Aperçu : {csv.rows.length} lignes. La première colonne devient le
            titre de chaque page.
          </p>
          <div className="database-table-scroll">
            <table className="database-table">
              <thead>
                <tr>
                  {csv.headers.map((header, i) => (
                    <th key={i}>
                      {header}
                      {i > 0 && (
                        <select
                          aria-label={`Type de ${header}`}
                          onChange={(e) =>
                            setCsv({
                              ...csv,
                              types: csv.types.map((t, index) =>
                                index === i
                                  ? (e.target.value as PropertyType)
                                  : t
                              ),
                            })
                          }
                          value={csv.types[i]}
                        >
                          {csvPropertyTypes.map((t) => (
                            <option key={t} value={t}>
                              {propertyTypeLabels[t]}
                            </option>
                          ))}
                        </select>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csv.rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      {result ? (
        <>
          <p className="success-text">
            Import terminé : {result.pageIds.length} pages racines créées.
          </p>
          {result.warnings.map((w) => (
            <p className="muted text-xs" key={w}>
              {w}
            </p>
          ))}
          <Button onClick={() => void onDone(result.pageIds[0]!)}>
            Ouvrir les pages importées
          </Button>
        </>
      ) : (
        (archive || csv) && (
          <div className="flex gap-2">
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const bundle = archive ?? csvArchive(csv!, name);
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
              }}
            >
              {busy ? "Import en cours…" : "Confirmer l’import"}
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                setArchive(null);
                setCsv(null);
              }}
              variant="outline"
            >
              Annuler
            </Button>
          </div>
        )
      )}
    </div>
  );
}
