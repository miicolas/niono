import { useEffect } from "react";
import { useUI } from "@/lib/ui/store";
/** ⌘K / Ctrl+K opens the search panel. */
export function useKeyboardShortcuts() {
  const setPanel = useUI((s) => s.setPanel);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel("search");
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [setPanel]);
}
