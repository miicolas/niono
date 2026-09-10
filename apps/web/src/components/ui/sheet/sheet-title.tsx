"use client";
import * as React from "react";
import { cn } from "cn";
import { Dialog as SheetPrimitive } from "radix-ui";

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}
