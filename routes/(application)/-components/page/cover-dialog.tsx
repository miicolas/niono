import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IMAGE_ACCEPT, isImageMime } from "@/constants/image-types";
import { uploadFile } from "@/lib/editor/upload-file";
import { reportError } from "@/lib/ui/notifications";
import type { MetadataChanges } from "@/routes/(application)/-lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  pageId: string;
  cover: string | null;
  coverPosition: number;
  /** Enregistre la couverture ; résout `true` quand elle a été appliquée. */
  onUpdate: (changes: MetadataChanges) => Promise<boolean>;
};

export function CoverDialog({
  open,
  onClose,
  pageId,
  cover,
  coverPosition,
  onUpdate,
}: Props) {
  const upload = async (file: File) => {
    try {
      const asset = await uploadFile(pageId, file);
      if (!isImageMime(asset.mime)) {
        throw new Error("Ce fichier n’est pas une image prise en charge.");
      }
      if (await onUpdate({ cover: asset.url })) {
        onClose();
      }
    } catch (error) {
      reportError(error);
    }
  };
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Habillez votre page</DialogTitle>
          <DialogDescription>
            Importez une image PNG, JPEG, GIF ou WebP.
          </DialogDescription>
        </DialogHeader>
        <input
          accept={IMAGE_ACCEPT}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              upload(file);
            }
          }}
          type="file"
        />
        {cover && (
          <label className="grid gap-3">
            Position de la couverture
            <input
              aria-label="Position de la couverture"
              defaultValue={coverPosition}
              max={100}
              min={0}
              onKeyUp={(e) =>
                onUpdate({ coverPosition: Number(e.currentTarget.value) })
              }
              onPointerUp={(e) =>
                onUpdate({ coverPosition: Number(e.currentTarget.value) })
              }
              type="range"
            />
          </label>
        )}
      </DialogContent>
    </Dialog>
  );
}
