import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { uploadFile } from "@/features/editor/upload";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { reportError } from "@/lib/notifications";
import { type PageState } from "./shared";

export function PageCoverDialog({
  panel,
  setPanel,
  fileInput,
  page,
  update,
  metadata,
}: Pick<
  PageState,
  "panel" | "setPanel" | "fileInput" | "page" | "update" | "metadata"
>) {
  return (
    <Dialog
      open={panel === "cover"}
      onOpenChange={(v) => {
        if (!v) setPanel("none");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Habillez votre page</DialogTitle>
          <DialogDescription>
            Importez une image PNG, JPEG, GIF ou WebP.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          ref={fileInput}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const asset = await uploadFile(page.id, file);
              if (!asset.mime.startsWith("image/"))
                throw new Error(
                  "Ce fichier n’est pas une image prise en charge.",
                );
              if (await update({ cover: asset.url })) setPanel("none");
            } catch (error) {
              reportError(error);
            }
          }}
        />
        {metadata.cover && (
          <Label className="grid gap-3">
            Position de la couverture
            <Slider
              aria-label="Position de la couverture"
              min={0}
              max={100}
              defaultValue={[metadata.coverPosition]}
              onValueCommit={([position]) =>
                void update({ coverPosition: position! })
              }
            />
          </Label>
        )}
      </DialogContent>
    </Dialog>
  );
}
