// Adapté du registre officiel shadcn/ui (MIT), style base-nova.
"use client";
import * as React from "react";
import { MessageScroller as MessageScrollerPrimitive } from "@shadcn/react/message-scroller";
import { cn } from "cn";

export function MessageScrollerItem({
  className,
  scrollAnchor = false,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Item>) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      scrollAnchor={scrollAnchor}
      className={cn(
        "min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]",
        className,
      )}
      {...props}
    />
  );
}
