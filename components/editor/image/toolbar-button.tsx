import type { ReactNode } from "react";

export type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
};

/**
 * Bouton de la barre d'actions d'une image. Il agit sans prendre le focus, si
 * bien que l'image reste sélectionnée et que la barre ne disparaît pas au clic.
 */
export function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      aria-label={label}
      className="toolbar-action"
      data-active={active}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
