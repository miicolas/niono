import { useState } from "react";
import Papa from "papaparse";
import {
  archiveSchema,
  emptyDocument,
  validatePropertyValue,
  type Archive,
  type PropertyType,
} from "@digipm/contracts";
import { client } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseImportedPage } from "./transfer";
import { reportError } from "@/lib/notifications";
type Csv = { headers: string[]; rows: string[][]; types: PropertyType[] };
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
    if (file.size > 16 * 1024 * 1024)
      throw new Error("Le fichier dépasse 16 Mo.");
    const text = await file.text();
    if (file.name.toLowerCase().endsWith(".csv")) {
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
      if (parsed.errors.length) throw new Error(parsed.errors[0]!.message);
      const headers = parsed.data[0];
      if (!headers?.length || headers.length > 21 || parsed.data.length > 200)
        throw new Error(
          "Le CSV doit contenir au maximum 199 lignes et 21 colonnes.",
        );
      if (new Set(headers).size !== headers.length)
        throw new Error("Les noms de colonnes doivent être uniques.");
      if (parsed.data.slice(1).some((row) => row.length !== headers.length))
        throw new Error(
          "Certaines lignes n’ont pas le même nombre de colonnes.",
        );
      setCsv({
        headers,
        rows: parsed.data.slice(1),
        types: headers.map(() => "text"),
      });
      return;
    }
    if (file.name.endsWith(".json")) {
      const parsed = JSON.parse(text);
      if (parsed?.format === "digipm-archive") {
        const result = archiveSchema.parse(parsed);
        setArchive(result);
        setWarnings(result.warnings);
        return;
      }
    }
    if (file.size > 2 * 1024 * 1024)
      throw new Error("Un document seul ne doit pas dépasser 2 Mo.");
    const imported = parseImportedPage(file.name, text);
    setArchive({
      format: "digipm-archive",
      version: 1,
      pages: [
        {
          id: crypto.randomUUID(),
          parentId: null,
          title: imported.title,
          icon: imported.icon,
          kind: "page",
          privateRoot: false,
          cover: null,
          content: imported.content,
        },
      ],
      sources: [],
      properties: [],
      entries: [],
      values: [],
      views: [],
      assets: [],
      warnings: [],
    });
    if (!file.name.endsWith(".json"))
      setWarnings([
        "Les images externes, blocs HTML avancés et mises en page non prises en charge ne sont pas importés. Le JSON DigiPM conserve les blocs fidèlement.",
      ]);
  }
  function csvArchive(data: Csv): Archive {
    const pageId = crypto.randomUUID(),
      sourceId = crypto.randomUUID();
    const properties = data.headers.slice(1).map((name, i) => ({
      id: crypto.randomUUID(),
      sourceId,
      name,
      type: data.types[i + 1]!,
      options:
        data.types[i + 1] === "select"
          ? [
              ...new Set(data.rows.map((row) => row[i + 1]).filter(Boolean)),
            ].map((name) => ({
              id: crypto.randomUUID(),
              name: name!,
              color: "gray",
            }))
          : [],
    }));
    const pages: Archive["pages"] = [
      {
        id: pageId,
        parentId: null,
        title: name,
        icon: "▦",
        kind: "database",
        privateRoot: false,
        cover: null,
        content: emptyDocument,
      },
    ];
    const entries: Archive["entries"] = [];
    const values: Archive["values"] = [];
    for (const [index, row] of data.rows.entries()) {
      const id = crypto.randomUUID();
      pages.push({
        id,
        parentId: pageId,
        title: row[0] || "Sans titre",
        icon: "📄",
        kind: "page",
        privateRoot: false,
        cover: null,
        content: emptyDocument,
      });
      entries.push({ pageId: id, sourceId });
      for (const [i, p] of properties.entries()) {
        const raw = row[i + 1] ?? "";
        const value =
          raw === ""
            ? null
            : p.type === "number"
              ? Number(raw)
              : p.type === "checkbox"
                ? /^(true|1|oui|yes)$/i.test(raw)
                : p.type === "select"
                  ? (p.options.find((o) => o.name === raw)?.id ?? null)
                  : raw;
        if (
          !validatePropertyValue(p.type, value, p.options) ||
          (p.type === "checkbox" &&
            raw !== "" &&
            !/^(true|false|0|1|oui|non|yes|no)$/i.test(raw))
        )
          throw new Error(
            `Ligne ${index + 2}, « ${p.name} » : « ${raw} » n’est pas une valeur ${p.type} valide.`,
          );
        values.push({ pageId: id, propertyId: p.id, value });
      }
    }
    return {
      format: "digipm-archive",
      version: 1,
      pages,
      sources: [{ id: sourceId, pageId }],
      properties,
      entries,
      values,
      views: [
        {
          sourceId,
          name: "Table",
          config: {
            layout: "table",
            sortBy: "position",
            sortDirection: "asc",
            hidden: [],
            filters: [],
            filterMode: "and",
          },
        },
      ],
      assets: [],
      warnings: [],
    };
  }
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
          <label>
            Nom de la base
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={300}
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
                          value={csv.types[i]}
                          onChange={(e) =>
                            setCsv({
                              ...csv,
                              types: csv.types.map((t, index) =>
                                index === i
                                  ? (e.target.value as PropertyType)
                                  : t,
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
                            <option value={t.id} key={t.id}>
                              {t.label}
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
