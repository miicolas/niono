import { ExternalLink, Maximize2, Trash2, Type } from "lucide-react";
import type { ImageAlign } from "@/lib/editor/image-align";
import { ALIGN_OPTIONS } from "../align-options";
import { ToolbarButton } from "./toolbar-button";

const OPEN_LABEL = "Ouvrir dans un nouvel onglet";

export type ImageToolbarProps = {
  align: ImageAlign;
  src: string;
  altOpen: boolean;
  onAlign: (align: ImageAlign) => void;
  onFullWidth: () => void;
  onToggleAlt: () => void;
  onDelete: () => void;
};

/** Actions affichées au-dessus d'une image sélectionnée. */
export function ImageToolbar({
  align,
  src,
  altOpen,
  onAlign,
  onFullWidth,
  onToggleAlt,
  onDelete,
}: ImageToolbarProps) {
  return (
    <div
      aria-label="Actions de l’image"
      className="image-toolbar"
      contentEditable={false}
      role="toolbar"
    >
      {ALIGN_OPTIONS.map((option) => (
        <ToolbarButton
          active={align === option.value}
          key={option.value}
          label={option.label}
          onClick={() => onAlign(option.value)}
        >
          <option.icon size={14} />
        </ToolbarButton>
      ))}
      <i />
      <ToolbarButton label="Pleine largeur" onClick={onFullWidth}>
        <Maximize2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        active={altOpen}
        label="Texte alternatif"
        onClick={onToggleAlt}
      >
        <Type size={14} />
      </ToolbarButton>
      <a
        aria-label={OPEN_LABEL}
        className="toolbar-action"
        href={src}
        onMouseDown={(event) => event.preventDefault()}
        rel="noopener noreferrer"
        target="_blank"
        title={OPEN_LABEL}
      >
        <ExternalLink size={14} />
      </a>
      <i />
      <ToolbarButton label="Supprimer l’image" onClick={onDelete}>
        <Trash2 size={14} />
      </ToolbarButton>
    </div>
  );
}
