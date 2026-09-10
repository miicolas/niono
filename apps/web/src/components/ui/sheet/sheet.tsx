"use client";
import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";

export function Sheet({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}
