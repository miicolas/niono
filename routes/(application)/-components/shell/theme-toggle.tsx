import { Moon, Sun } from "lucide-react";
import { useUI } from "@/lib/ui/store";
export function ThemeToggle() {
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const dark = theme === "dark";
  return (
    <button
      aria-label={dark ? "Passer au thème papier" : "Passer au thème sombre"}
      className="icon-button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      type="button"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
