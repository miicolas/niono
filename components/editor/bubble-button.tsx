import type { ReactNode } from "react";

export type BubbleButtonProps = {
  label: string;
  active?: boolean;
  title?: string;
  onClick: () => void;
  children: ReactNode;
};

/** Bouton d'action de la bulle de sélection. */
export function BubbleButton({
  label,
  active,
  title,
  onClick,
  children,
}: BubbleButtonProps) {
  return (
    <button
      aria-label={label}
      data-active={active}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}
