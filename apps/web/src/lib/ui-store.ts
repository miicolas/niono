import { create } from "zustand";
type Panel = "none" | "search" | "settings" | "trash" | "templates";
export const useUI = create<{
  panel: Panel;
  setPanel: (p: Panel) => void;
  expanded: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}>((set) => ({
  panel: "none",
  setPanel: (panel) => set({ panel }),
  expanded: {},
  toggleExpanded: (id) =>
    set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),
  theme: "dark",
  setTheme: (theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("digipm-theme", theme);
    set({ theme });
  },
}));
