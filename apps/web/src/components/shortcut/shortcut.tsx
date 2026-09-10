import { useSyncExternalStore } from "react";
import { formatForDisplay, type Hotkey } from "@tanstack/react-hotkeys";
import { Kbd } from "@/components/ui/kbd";
import { subscribe } from "./subscribe";

export function Shortcut({ hotkey }: { hotkey: Hotkey }) {
  // The server cannot know the keyboard platform; fill the label after hydration.
  const label = useSyncExternalStore(
    subscribe,
    () => formatForDisplay(hotkey),
    () => "",
  );
  return (
    <Kbd className="shortcut" aria-hidden="true">
      {label}
    </Kbd>
  );
}
