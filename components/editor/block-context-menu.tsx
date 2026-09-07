import type { RefObject } from "react";
import type { BlockActionKind } from "./block-actions";
import { BLOCK_MENU_ITEMS } from "./block-menu-items";
import type { MenuPosition } from "./use-block-menu";

export type BlockContextMenuProps = {
  menuRef: RefObject<HTMLDivElement | null>;
  position: MenuPosition;
  onAction: (kind: BlockActionKind) => void;
};

/** Actions proposées sur le bloc saisi par la poignée. */
export function BlockContextMenu({
  menuRef,
  position,
  onAction,
}: BlockContextMenuProps) {
  return (
    <div
      className="block-context-menu"
      ref={menuRef}
      role="menu"
      style={{ left: position.x, top: position.y }}
    >
      <div className="menu-caption">ACTIONS DU BLOC</div>
      {BLOCK_MENU_ITEMS.map((item) => (
        <button
          key={item.kind}
          onClick={() => onAction(item.kind)}
          role="menuitem"
          type="button"
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  );
}
