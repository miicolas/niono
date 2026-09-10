// Adapté du registre officiel shadcn/ui (MIT), style base-nova.
"use client";
import * as React from "react";
import { MessageScroller as MessageScrollerPrimitive } from "@shadcn/react/message-scroller";
import { cn } from "cn";

export function MessageScroller({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Root>) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn(
        "group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}
