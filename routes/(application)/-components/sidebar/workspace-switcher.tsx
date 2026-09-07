import { ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Bootstrap } from "@/routes/(application)/-lib/types";
export function WorkspaceSwitcher({
  workspaces,
  currentName,
  onSwitch,
  onNew,
}: {
  workspaces: Bootstrap["workspaces"];
  currentName?: string;
  onSwitch: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="workspace-switcher" type="button">
          <span className="brand-mark small">D</span>
          <span className="name">{currentName ?? "Mon espace"}</span>
          <ChevronsUpDown size={13} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Vos espaces de travail</DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} onClick={() => onSwitch(w.id)}>
            <span className="avatar">{w.name[0]}</span>
            {w.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNew}>
          <Plus />
          Créer un espace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
