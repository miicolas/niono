import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { reportError } from "@/lib/notifications";
import { type PageState } from "./shared";
import { ShareForm } from "./share-form";

export function PageShareDialog({
  panel,
  setPanel,
  metadata,
  props,
  data,
  page,
  members,
  metadataRef,
  setMetadata,
  cache,
}: Pick<
  PageState,
  | "panel"
  | "setPanel"
  | "metadata"
  | "props"
  | "data"
  | "page"
  | "members"
  | "metadataRef"
  | "setMetadata"
  | "cache"
>) {
  return (
    <Dialog
      open={panel === "share"}
      onOpenChange={(v) => {
        if (!v) setPanel("none");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager cette page</DialogTitle>
          <DialogDescription>
            {metadata.privateRoot
              ? "Cette page est restreinte."
              : "Les membres autorisés de l’espace ont accès à cette page."}{" "}
            Les accès de ses pages parentes s’appliquent également.
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="outline"
          onClick={() => {
            void navigator.clipboard
              .writeText(window.location.href)
              .then(() =>
                import("sonner").then(({ toast }) =>
                  toast.success("Lien copié"),
                ),
              )
              .catch(reportError);
          }}
        >
          Copier le lien
        </Button>
        {metadata.createdBy === props.user.id && (
          <ShareForm
            grants={data.grants}
            pageId={page.id}
            isPrivate={metadata.privateRoot}
            members={members.data ?? []}
            onDone={async () => {
              setPanel("none");
              const fresh = await client.pages.get({ id: page.id });
              metadataRef.current = fresh.page;
              setMetadata(fresh.page);
              cache.setQueryData(["page", page.id], fresh);
              await props.onRefresh();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
