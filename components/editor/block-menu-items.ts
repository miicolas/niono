import {
  ArrowDown,
  ArrowUp,
  Copy,
  type LucideIcon,
  Trash2,
} from "lucide-react";
import type { BlockActionKind } from "./block-actions";

export type BlockMenuItem = {
  kind: BlockActionKind;
  label: string;
  icon: LucideIcon;
};

/** Entrées du menu contextuel d'un bloc, dans l'ordre d'affichage. */
export const BLOCK_MENU_ITEMS: BlockMenuItem[] = [
  { kind: "duplicate", label: "Dupliquer", icon: Copy },
  { kind: "up", label: "Déplacer vers le haut", icon: ArrowUp },
  { kind: "down", label: "Déplacer vers le bas", icon: ArrowDown },
  { kind: "delete", label: "Supprimer", icon: Trash2 },
];
