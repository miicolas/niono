import { download } from "@/lib/ui/download";
/** Télécharge la page seule au format JSON « digipm-page ». */
export function exportPageJson(title: string, icon: string, content: unknown) {
  download(
    `${title}.json`,
    JSON.stringify(
      { format: "digipm-page", version: 1, title, icon, content },
      null,
      2
    ),
    "application/json"
  );
}
