import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

export function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}
