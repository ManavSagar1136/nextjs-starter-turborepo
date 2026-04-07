/** @type {import('next-sitemap').IConfig} */

const isProduction = process.env.NODE_ENV === "production";

const disallow = isProduction
  ? [
      "/api/**",
      "/_next/**",
    ]
  : "/"; // disallow everything in non-production

const allow = isProduction ? "/" : "";

const siteUrl = process.env.NEXT_PUBLIC_PUBLIC_APP_URL ?? "http://localhost:3100";
const finalUrl = siteUrl.replace(/\/$/, ""); // remove trailing slash

// Section sitemaps served by route handlers — excluded from main auto-crawl
const additionalSitemaps = [
  "/all-pages/sitemap.xml",
  "/blogs/sitemap.xml",
  "/docs/sitemap.xml",
  "/changelogs/sitemap.xml",
];

module.exports = {
  siteUrl: finalUrl,
  generateRobotsTxt: true,
  exclude: [...additionalSitemaps],
  robotsTxtOptions: {
    additionalSitemaps: additionalSitemaps.map((s) => `${finalUrl}${s}`),
    policies: [
      {
        userAgent: "*",
        allow: allow,
        disallow: disallow,
      },
    ],
  },
};
