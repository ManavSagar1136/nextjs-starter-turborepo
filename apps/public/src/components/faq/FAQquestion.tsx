import { ReactElement } from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@buildbase/ui/accordion";

export type FAQQuestionProps = {
  question: string;
  answer: ReactElement | string;
};

export const FAQQuestion = ({ question, answer }: FAQQuestionProps) => {
  return (
    <AccordionItem
      key={question}
      value={`item-${question}`}
      className="border-b border-border/40 last:border-b-0"
    >
      <AccordionTrigger
        className="text-left py-5 px-0 hover:no-underline group transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        aria-label={`Toggle ${question}`}
      >
        <span className="flex-1 text-base font-semibold leading-relaxed text-foreground pr-4 text-left">
          {question}
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-5 pt-0">
        <div className="text-sm leading-relaxed text-muted-foreground">
          {answer}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
