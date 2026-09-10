import { useState } from "react";
import Papa from "papaparse";
import {
  archiveSchema,
  viewSchema,
  emptyDocument,
  validatePropertyValue,
  type Archive,
} from "@digipm/contracts";
import { parseImportedPage } from "../transfer";
import { type Csv } from "./shared";

export function useImportPanel({
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
          config: viewSchema.parse({ layout: "table" }),
        },
      ],
      assets: [],
      warnings: [],
    };
  }
  return {
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
  };
}
