import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import HeaderCard from "@/components/ui/HeaderCard";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";
import TestimonialMarquee, {
  ITestimonial,
} from "@/components/marketing/TestimonialMarquee";

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
    <PageWithHeaderFooter className="space-y-10">
      <HeaderCard
        mainTitle="Loved by developers worldwide"
        subTitle="See what our customers are saying about us on Twitter"
        h1
      />
      <div className="grid gap-6 max-w-4xl mx-auto">
        <TestimonialMarquee testimonials={testimonials} />
      </div>
    </PageWithHeaderFooter>
  );
};

export default TestimonialWall;
