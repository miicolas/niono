// Adapté du registre officiel shadcn/ui (MIT), style base-nova.
"use client";
import * as React from "react";
import { MessageScroller as MessageScrollerPrimitive } from "@shadcn/react/message-scroller";
import { cn } from "cn";

export function MessageScrollerViewport({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        "size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content data-autoscrolling:scrollbar-thumb-transparent data-autoscrolling:scrollbar-track-transparent data-pending-scroll:invisible",
        className,
      )}
      {...props}
    />
  );
}
