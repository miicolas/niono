"use client";
import type { ComponentProps } from "react";
import { Questionnaire as Primitive } from "@shadcn/react/questionnaire";
import { cn } from "cn";
import { buttonVariants, type Button } from "@/components/ui/button";
import {
  questionnaireActions,
  questionnaireActionVariants,
} from "./action-variants";

type Props = ComponentProps<typeof Primitive.Next> &
  Pick<ComponentProps<typeof Button>, "size" | "variant"> & {
    action: keyof typeof questionnaireActions;
  };

export function QuestionnaireAction({
  action,
  children,
  className,
  size = "default",
  variant,
  ...props
}: Props) {
  const {
    component: Action,
    label,
    position,
    variant: defaultVariant,
  } = questionnaireActions[action];
  const appearance = variant ?? defaultVariant;
  return (
    <Action
      data-slot={`questionnaire-${action}`}
      data-size={size}
      data-variant={appearance}
      className={cn(
        buttonVariants({ size, variant: appearance }),
        questionnaireActionVariants({ position }),
        className,
      )}
      {...props}
    >
      {children ?? label}
    </Action>
  );
}
