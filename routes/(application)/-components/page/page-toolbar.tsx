import { Share2, Star } from "lucide-react";
import type { ComponentProps } from "react";
import type { DocumentSaveStatus } from "@/routes/(application)/-lib/use-document-save";
import { PageActionsMenu } from "./page-actions-menu";
import { SaveStatus } from "./save-status";

type Props = {
  status: DocumentSaveStatus;
  favorite: boolean;
  onFavorite: () => void;
  onShare: () => void;
  menu: ComponentProps<typeof PageActionsMenu>;
};

export function PageToolbar({
  status,
  favorite,
  onFavorite,
  onShare,
  menu,
}: Props) {
  return (
    <div className="page-toolbar">
      <SaveStatus status={status} />
      <button
        aria-label="Favoris"
        className="icon-button"
        onClick={onFavorite}
        type="button"
      >
        <Star fill={favorite ? "currentColor" : "none"} size={15} />
      </button>
      <button className="subtle-button" onClick={onShare} type="button">
        <Share2 size={13} />
        Partager
      </button>
      <PageActionsMenu {...menu} />
    </div>
  );
}
