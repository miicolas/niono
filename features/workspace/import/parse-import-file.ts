import Papa from "papaparse";
import { MAX_ARCHIVE_BYTES } from "@/constants/limits";
import {
  type Archive,
  archiveSchema,
  emptyArchive,
} from "@/validators/transfer";
import type { Csv } from "./csv-archive";
import { parseImportedPage } from "./parse-imported-page";
export type ParsedImport = {
  csv?: Csv;
  archive?: Archive;
  warnings: string[];
};
const MARKDOWN_WARNING =
  "Les images externes, blocs HTML avancés et mises en page non prises en charge ne sont pas importés. Le JSON DigiPM conserve les blocs fidèlement.";
function parseCsv(text: string): Csv {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  if (parsed.errors.length) {
    throw new Error(parsed.errors[0]!.message);
  }
  const headers = parsed.data[0];
  if (!headers?.length || headers.length > 21 || parsed.data.length > 200) {
    throw new Error(
      "Le CSV doit contenir au maximum 199 lignes et 21 colonnes."
    );
  }
  if (new Set(headers).size !== headers.length) {
    throw new Error("Les noms de colonnes doivent être uniques.");
  }
  if (parsed.data.slice(1).some((row) => row.length !== headers.length)) {
    throw new Error("Certaines lignes n’ont pas le même nombre de colonnes.");
  }
  return {
    headers,
    rows: parsed.data.slice(1),
    types: headers.map(() => "text"),
  };
}
export async function parseImportFile(file: File): Promise<ParsedImport> {
  if (file.size > MAX_ARCHIVE_BYTES) {
    throw new Error("Le fichier dépasse 16 Mo.");
  }
  const text = await file.text();
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    return { csv: parseCsv(text), warnings: [] };
  }
  if (name.endsWith(".json")) {
    const parsed = JSON.parse(text);
    if (parsed?.format === "digipm-archive") {
      const archive = archiveSchema.parse(parsed);
      return { archive, warnings: archive.warnings };
    }
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Un document seul ne doit pas dépasser 2 Mo.");
  }
  const page = parseImportedPage(file.name, text);
  return {
    archive: {
      ...emptyArchive(),
      pages: [
        {
          id: crypto.randomUUID(),
          parentId: null,
          title: page.title,
          icon: page.icon,
          kind: "page",
          privateRoot: false,
          cover: null,
          content: page.content,
        },
      ],
    },
    warnings: name.endsWith(".json") ? [] : [MARKDOWN_WARNING],
  };
}
