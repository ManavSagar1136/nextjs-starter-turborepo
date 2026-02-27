import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import TestimonialMarquee, { ITestimonial } from "@/components/testimonials/TestimonialMarquee";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Testimonials",
    description: "See what our customers are saying about us on Twitter",
    url: `${SiteConfig.baseUrl}${Routes.testimonials}`,
  });
}

const testimonials: ITestimonial[] = [
  {
    id: 1,
    author: {
      name: "Test 1 🐻",
      username: "@test",
      avatar: "/placeholder.svg?height=48&width=48",
      verified: false,
    },
    content:
      "<TODO> is fantastic, and so is Goutham! Have been really enjoying getting to know both in the past couple of weeks",
    date: "19 Apr 2022",
    metrics: {
      likes: 4,
      replies: 2,
    },
  },
  {
    id: 2,
    author: {
      name: "Test 2",
      username: "@test2",
      avatar: "/placeholder.svg?height=48&width=48",
      verified: true,
      role: "Founder @<TODO> 🚀",
    },
    content:
      "I absolutely love what you are doing @gouthamj, been a fan of yours from day One. ❤️\n\nAlways remembered our video call you telling me about the plans to build this. Looking forward to being a full customer soon.\n\nWe could do with our own <TODO> 🚀",
    date: "27 Apr 2022",
    metrics: {
      likes: 5,
      replies: 3,
    },
  },
  {
    id: 3,
    author: {
      name: "Test 3",
      username: "@test3",
      avatar: "/placeholder.svg?height=48&width=48",
      verified: false,
    },
    content:
      "You're very welcome Goutham!\n\nThank YOU for making <TODO>! 🙏\n\nThe React component is a big plus, it really improves the dev experience.",
    date: "11 Mar 2022",
    metrics: {
      likes: 3,
      replies: 1,
    },
  },
];

const TestimonialWall = () => {
  return (
    <PageWithHeaderFooter>
      <section
        className="w-full py-[var(--mk-section-y)] px-[var(--mk-section-x)]"
        style={{ background: "var(--mk-bg-primary)" }}
      >
        <div className="mx-auto max-w-4xl space-y-10">
          {/* Header */}
          <div className="text-center">
            <span className="mk-eyebrow mb-3 block">Testimonials</span>
            <h1
              className="font-extrabold leading-tight"
              style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
            >
              Loved by developers <span className="mk-gradient-text">worldwide.</span>
            </h1>
            <p
              className="mx-auto mt-4 max-w-xl leading-relaxed"
              style={{ fontSize: "var(--mk-text-lg)", color: "var(--mk-text-secondary)" }}
            >
              See what our customers are saying about us on Twitter
            </p>
          </div>

          <TestimonialMarquee testimonials={testimonials} />
        </div>
      </section>
    </PageWithHeaderFooter>
  );
};

export default TestimonialWall;
