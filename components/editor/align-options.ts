import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  type LucideIcon,
} from "lucide-react";
import type { ImageAlign } from "@/lib/editor/image-align";

export type AlignOption = {
  value: ImageAlign;
  label: string;
  icon: LucideIcon;
};

/** Alignements proposés au texte comme aux images, dans l'ordre d'affichage. */
export const ALIGN_OPTIONS: AlignOption[] = [
  { value: "left", label: "Aligner à gauche", icon: AlignLeft },
  { value: "center", label: "Centrer", icon: AlignCenter },
  { value: "right", label: "Aligner à droite", icon: AlignRight },
];
