export interface FAQQuestionProps {
  question: string;
  answer: string;
}

const DUMMY_FAQS: FAQQuestionProps[] = [
  {
    question: "What is this BuildBase NextJS Starter template?",
    answer: "It's a production-ready, full-stack CMS starter built with Next.js 15, Prisma, TypeScript, and Turborepo. It includes a public marketing site, admin dashboard, user portal, and documentation site — all in a single monorepo with shared packages.",
  },
  {
    question: "Is it free and open source?",
    answer: "Yes, the template is completely free and open source. You can clone it, modify it, and deploy it for any project — personal or commercial — with no licensing fees or vendor lock-in.",
  },
  {
    question: "Can I self-host it?",
    answer: "Absolutely. While it's optimized for Vercel deployment, you can self-host it on any platform that supports Node.js. Docker configurations are included for easy containerized deployment.",
  },
  {
    question: "What database does it use?",
    answer: "PostgreSQL is the default database, managed through Prisma ORM. You get type-safe database access, automatic migrations, and a visual database browser via Prisma Studio. You can also swap in MySQL or SQLite if needed.",
  },
  {
    question: "How is this different from Contentful or Strapi?",
    answer: "Unlike hosted CMS platforms, this template gives you full control over your code, data, and infrastructure. It's a monorepo with shared types across all apps, meaning your API is type-safe end-to-end. No monthly fees, no API rate limits, no vendor lock-in.",
  },
  {
    question: "Can I invite team members with different roles?",
    answer: "Yes, the template includes a full role-based access control (RBAC) system. You can create admin, editor, and viewer roles with granular permissions for content management.",
  },
  {
    question: "How do I add new content types?",
    answer: "Simply define a new model in your Prisma schema, run a migration, and the type-safe API layer is automatically generated. You can then build admin forms and public pages using shared UI components.",
  },
  {
    question: "Does it support multiple apps?",
    answer: "Yes, the monorepo architecture supports multiple Next.js apps out of the box: public site, admin dashboard, user portal, docs, and more. They all share packages for UI, database, utilities, and configuration.",
  },
];

export default DUMMY_FAQS;
