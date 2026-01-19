import { env } from "@buildbase/env";

/**
 * TypeScript types for site configuration
 */
export interface ISiteConfig {
  // App URLs (all apps can access all URLs)
  publicAppUrl: string;
  userAppUrl: string;
  adminAppUrl: string;
  docsAppUrl: string;

  // App branding
  name: string;
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };

  // Twitter/creator info
  twitter: {
    username: string;
    url: string;
  };
  creator: {
    name: string;
    url: string;
    twitter: {
      username: string;
      url: string;
    };
  };

  // Social links
  socials: {
    discordLink: string;
    twitterLink: string;
    youTubeLink: string;
  };

  // Made by info
  madeBy: {
    name: string;
    url: string;
  };

  // Support and other links
  supportEmail: string;
  signInCallbackUrl: string;
  affiliateProgramLink: string;
  affiliateStoreName: string;
  calendlyLink: string;

  // Login page configuration
  login: {
    title: string;
    description: string;
    buttonText: string;
  };
}

/**
 * Shared site configuration used across all apps
 * Contains all app URLs and shared branding information
 */
export const SiteConfig: ISiteConfig = {
  // App URLs - all apps can access all URLs
  publicAppUrl: env.NEXT_PUBLIC_PUBLIC_APP_URL || "http://localhost:3100",
  userAppUrl: env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3000",
  adminAppUrl: env.NEXT_PUBLIC_ADMIN_APP_URL || "http://localhost:3001",
  docsAppUrl: env.NEXT_PUBLIC_DOCS_APP_URL || "http://localhost:3002",

  // App branding
  name: "Next.js App",
  meta: {
    title: "Next.js App",
    description: "Add a description of your site to be used as a fallback for search engines and social media.",
    keywords: [],
  },

  // Twitter/creator info
  twitter: {
    username: "@your-nextjs-app",
    url: "https://twitter.com/your-nextjs-app",
  },
  creator: {
    name: "your-nextjs-app",
    url: env.NEXT_PUBLIC_PUBLIC_APP_URL || "",
    twitter: {
      username: "@your-nextjs-app",
      url: "https://twitter.com/your-nextjs-app",
    },
  },

  // Social links
  socials: {
    discordLink: "https://abc.com",
    twitterLink: "https://abc.com",
    youTubeLink: "https://abc.com",
  },

  // Made by info
  madeBy: {
    name: "Saas Developer Template",
    url: "https://saas.developertemplates.com",
  },

  // Support and other links
  supportEmail: "support@company.org",
  signInCallbackUrl: "/",
  affiliateProgramLink: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AFFILIATE_PROGRAM_LINK) || "",
  affiliateStoreName: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AFFILIATE_STORE_NAME) || "",
  calendlyLink: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BOOK_MEETING_LINK) || "",

  // Login page configuration
  // Note: title and buttonText will be overridden by app-specific configs
  login: {
    title: "Welcome back to Next.js App",
    description: "Login to your account to continue managing your content, websites, and applications",
    buttonText: "Login",
  },
};
