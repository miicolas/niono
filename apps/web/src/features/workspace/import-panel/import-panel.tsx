import type { CellContext } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { type PropertyType } from "@digipm/contracts";
import { client } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/notifications";
import { type ImportPanelProps } from "./shared";
import { useImportPanel } from "./use-import-panel";

export function ImportPanel(props: ImportPanelProps) {
  const {
    busy,
    choose,
    csv,
    name,
    setName,
    setCsv,
    archive,
    warnings,
    result,
    onDone,
    setBusy,
    csvArchive,
    setArchive,
    workspaceId,
    importId,
    setResult,
  } = useImportPanel(props);
  return (
    <div className="panel-form">
      <p className="muted text-xs">
        Markdown, texte, CSV ou archive JSON DigiPM. Les imports créent de
        nouvelles pages ; les fichiers existants restent en place.
      </p>
      <Input
        aria-label="Fichier à importer"
        type="file"
        accept=".md,.markdown,.txt,.json,.csv"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void choose(file).catch(reportError);
        }}
      />
      {csv && (
        <>
          <Label className="grid gap-2">
            Nom de la base
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={300}
            />
          </Label>
          <p className="muted text-xs">
            Aperçu : {csv.rows.length} lignes. La première colonne devient le
            titre de chaque page.
          </p>
          <div className="database-table-scroll">
            <DataTable
              className="database-table"
              data={csv.rows.slice(0, 5)}
              columns={csv.headers.map((header, i) => ({
                id: String(i),
                header: () => (
                  <>
                    {header}
                    {i > 0 && (
                      <SelectField
                        aria-label={`Type de ${header}`}
                        value={csv.types[i]}
                        onValueChange={(value) =>
                          setCsv({
                            ...csv,
                            types: csv.types.map((t, index) =>
                              index === i ? (value as PropertyType) : t,
                            ),
                          })
                        }
                      >
                        {[
                          { id: "text", label: "Texte" },
                          { id: "number", label: "Nombre" },
                          { id: "checkbox", label: "Case à cocher" },
                          { id: "date", label: "Date" },
                          { id: "select", label: "Sélection" },
                          { id: "email", label: "Email" },
                          { id: "url", label: "URL" },
                        ].map((t) => (
                          <SelectItem value={t.id} key={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectField>
                    )}
                  </>
                ),
                cell: ({ row }: CellContext<string[], unknown>) =>
                  row.original[i],
              }))}
            />
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
            <p key={w} className="muted text-xs">
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
                  const bundle = archive ?? csvArchive(csv!);
                  setArchive(bundle);
                  setCsv(null);
                  const imported = await client.transfer.import({
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
              variant="outline"
              disabled={busy}
              onClick={() => {
                setArchive(null);
                setCsv(null);
              }}
            >
              Annuler
            </Button>
          </div>
        )
      )}
    </div>
  );
}
