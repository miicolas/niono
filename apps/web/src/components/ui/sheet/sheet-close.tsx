"use client";
import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";

export function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}
