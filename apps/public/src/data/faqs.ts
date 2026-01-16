export interface FAQQuestionProps {
  question: string;
  answer: string;
}

const DUMMY_FAQS: FAQQuestionProps[] = [
  {
    question: "Is there a free plan?",
    answer: "Yes, there is a free plan. You can use our platform with limited features for free.",
  },
  {
    question: "Can I invite team members?",
    answer: "Yes, you can invite team members from your workspace.",
  },
  {
    question: "Can I do this?",
    answer: "Yes, you can do this.",
  },
  {
    question: "Can I do that?",
    answer: "Yes, you can do that.",
  },
];

export default DUMMY_FAQS;
