"use client";
import type { ComponentProps } from "react";
import { Questionnaire as Primitive } from "@shadcn/react/questionnaire";
import type { Button } from "@/components/ui/button";
import { QuestionnaireAction } from "./questionnaire-action";

export function QuestionnaireSubmit(
  props: ComponentProps<typeof Primitive.Submit> &
    Pick<ComponentProps<typeof Button>, "size" | "variant">,
) {
  return <QuestionnaireAction action="submit" {...props} />;
}
