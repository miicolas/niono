import { useEffect, useRef, useState } from "react";

export type MenuPosition = { x: number; y: number };

/**
 * Menu contextuel d'un bloc : sa position à l'écran, le bloc visé par la
 * poignée, et sa fermeture au premier clic en dehors.
 */
export function useBlockMenu() {
  const [menu, setMenu] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nodePos = useRef(0);
  useEffect(() => {
    if (!menu) {
      return;
    }
    const close = (event: MouseEvent) => {
      const inside =
        event.target instanceof Node && menuRef.current?.contains(event.target);
      if (!inside) {
        setMenu(null);
      }
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu]);
  return { menu, menuRef, nodePos, open: setMenu, close: () => setMenu(null) };
}
