import { Text } from "@react-email/components";
import type { ReactNode } from "react";

const style = { color: "#27272a", fontSize: "15px", lineHeight: "24px" };

export function EmailText({ children }: { children: ReactNode }) {
  return <Text style={style}>{children}</Text>;
}
