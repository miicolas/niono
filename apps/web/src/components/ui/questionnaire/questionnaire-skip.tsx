"use client";
import type { ComponentProps } from "react";
import { Questionnaire as Primitive } from "@shadcn/react/questionnaire";
import type { Button } from "@/components/ui/button";
import { QuestionnaireAction } from "./questionnaire-action";

export function QuestionnaireSkip(
  props: ComponentProps<typeof Primitive.Skip> &
    Pick<ComponentProps<typeof Button>, "size" | "variant">,
) {
  return <QuestionnaireAction action="skip" {...props} />;
}
