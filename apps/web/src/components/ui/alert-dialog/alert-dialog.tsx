import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

export function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}
