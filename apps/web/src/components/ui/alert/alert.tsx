import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { alertVariants } from "./shared";

export function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
