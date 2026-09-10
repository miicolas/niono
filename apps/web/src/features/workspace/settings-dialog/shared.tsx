import {
  FileUp,
  LockKeyhole,
  Settings2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { OpenAILogo } from "@/components/openai-logo";

export const personalTabs = [
  { id: "general", label: "Général", icon: Settings2 },
  { id: "account", label: "Mon profil", icon: UserRound },
  { id: "security", label: "Sécurité", icon: LockKeyhole },
  { id: "codex", label: "Codex", icon: OpenAILogo },
];

export const workspaceTabs = [
  { id: "members", label: "Membres", icon: UsersRound },
  { id: "teams", label: "Équipes", icon: UsersRound },
  { id: "import", label: "Importer", icon: FileUp },
];
