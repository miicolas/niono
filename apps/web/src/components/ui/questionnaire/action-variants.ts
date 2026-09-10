import { Questionnaire as Primitive } from "@shadcn/react/questionnaire";
import { cva } from "class-variance-authority";

export const questionnaireActions = {
  previous: {
    component: Primitive.Previous,
    label: "Précédent",
    position: "start",
    variant: "outline",
  },
  skip: {
    component: Primitive.Skip,
    label: "Passer",
    position: "middle",
    variant: "outline",
  },
  next: {
    component: Primitive.Next,
    label: "Suivant",
    position: "end",
    variant: "default",
  },
  submit: {
    component: Primitive.Submit,
    label: "Terminer",
    position: "end",
    variant: "default",
  },
} as const;

export const questionnaireActionVariants = cva(
  "row-start-1 min-h-11 sm:min-h-0",
  {
    variants: {
      position: {
        start: "col-start-1 justify-self-start",
        middle: "col-start-2 justify-self-end",
        end: "col-start-3 justify-self-end",
      },
    },
  },
);
