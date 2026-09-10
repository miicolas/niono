import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

export function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}
