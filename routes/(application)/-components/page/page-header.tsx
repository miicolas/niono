import { Clock3, ImagePlus } from "lucide-react";
import type {
  PageMetadata,
  PagePanel,
} from "@/routes/(application)/-lib/types";
import { PageMeta } from "./page-meta";
import { PageTitleInput } from "./page-title-input";

type Props = {
  metadata: PageMetadata;
  canEdit: boolean;
  userName: string;
  title: string;
  onTitleChange: (value: string) => void;
  onTitleCommit: () => void;
  onTitleEnter: () => void;
  onOpenPanel: (panel: PagePanel) => void;
};

export function PageHeader({
  metadata,
  canEdit,
  userName,
  title,
  onTitleChange,
  onTitleCommit,
  onTitleEnter,
  onOpenPanel,
}: Props) {
  return (
    <>
      <button
        aria-label="Changer l’icône"
        className="document-icon"
        disabled={!canEdit}
        onClick={() => onOpenPanel("icon")}
        type="button"
      >
        {metadata.icon}
      </button>
      {canEdit && (
        <div className="document-properties">
          {!metadata.cover && (
            <button onClick={() => onOpenPanel("cover")} type="button">
              <ImagePlus size={13} />
              Ajouter une couverture
            </button>
          )}
          <button onClick={() => onOpenPanel("history")} type="button">
            <Clock3 size={12} />
            Historique
          </button>
        </div>
      )}
      <PageTitleInput
        disabled={!canEdit}
        onChange={onTitleChange}
        onCommit={onTitleCommit}
        onEnter={onTitleEnter}
        value={title}
      />
      <PageMeta
        canEdit={canEdit}
        privateRoot={metadata.privateRoot}
        updatedAt={metadata.updatedAt}
        userName={userName}
      />
    </>
  );
}
