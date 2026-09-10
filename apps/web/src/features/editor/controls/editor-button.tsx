import { type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
export function EditorButton(props: ComponentProps<"button">) {
  return <Button variant="ghost" size="sm" type="button" {...props} />;
}
