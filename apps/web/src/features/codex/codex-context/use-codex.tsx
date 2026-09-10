import { useContext } from "react";
import { CodexContext } from "./shared";

export function useCodex() {
  const value = useContext(CodexContext);
  if (!value) throw new Error("CodexProvider manquant");
  return value;
}
