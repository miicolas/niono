import { CollaborationPresence } from "../../realtime/collaboration-presence";
import { Spinner } from "@/components/ui/spinner";
import { download } from "@/lib/download";
import {
  MoreHorizontal,
  Star,
  Clock3,
  Share2,
  Check,
  FileDown,
  Copy,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { reportError } from "@/lib/notifications";
import { exportMarkdown } from "../transfer";
import { type PageState } from "./shared";

export function PageToolbar({
  save,
  props,
  page,
  setPanel,
  title,
  editorRef,
  metadata,
  document,
  canEdit,
}: Pick<
  PageState,
  | "save"
  | "props"
  | "page"
  | "setPanel"
  | "title"
  | "editorRef"
  | "metadata"
  | "document"
  | "canEdit"
>) {
  return (
    <div className="page-toolbar">
      <CollaborationPresence peers={save.peers} />
      <span
        className={`save-status ${save.status === "conflict" || save.status === "error" ? "error" : ""}`}
        role="status"
      >
        {save.status === "saving" ? (
          <Spinner className="animate-spin" />
        ) : save.status === "saved" ? (
          <Check size={12} />
        ) : null}
        {
          {
            saved: "Enregistré",
            dirty: "Modifications…",
            saving: "Enregistrement…",
            error: "Hors ligne · brouillon local",
            conflict: "Conflit à résoudre",
          }[save.status]
        }
      </span>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="icon-button"
        aria-label="Favoris"
        onClick={() => props.onAction("favorite")}
      >
        <Star
          size={15}
          fill={
            props.pages.find((p) => p.id === page.id)?.favorite
              ? "currentColor"
              : "none"
          }
        />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="subtle-button"
        onClick={() => setPanel("share")}
      >
        <Share2 size={13} />
        Partager
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="icon-button"
            aria-label="Actions de la page"
          >
            <MoreHorizontal size={17} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={async () => {
              try {
                await save.flush();
                if (save.dirty())
                  throw new Error(
                    "Enregistrez le brouillon avant d’exporter l’archive.",
                  );
                await save.flush();
                if (save.dirty())
                  throw new Error(
                    "Enregistrez ou résolvez le conflit avant d’exporter l’archive.",
                  );
                const archive = await client.transfer.export({
                  pageId: page.id,
                  includeAssets: true,
                });
                download(
                  `${title}-archive.json`,
                  JSON.stringify(archive, null, 2),
                  "application/json",
                );
              } catch (error) {
                reportError(error);
              }
            }}
          >
            <FileDown />
            Exporter la page et ses sous-pages
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setPanel("history")}>
            <Clock3 />
            Historique des versions
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void exportMarkdown(
                title,
                editorRef.current?.getHTML() ?? "",
                page.id,
              ).catch(reportError);
            }}
          >
            <FileDown />
            Exporter en Markdown
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              download(
                `${title}.json`,
                JSON.stringify(
                  {
                    format: "digipm-page",
                    version: 1,
                    title,
                    icon: metadata.icon,
                    content: editorRef.current?.getJSON() ?? document.content,
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            <FileDown />
            Exporter en JSON
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => props.onAction("duplicate")}>
                <Copy />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => props.onAction("move")}>
                <ArrowUpRight />
                Déplacer vers…
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => props.onAction("trash")}
              >
                <Trash2 />
                Mettre à la corbeille
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
