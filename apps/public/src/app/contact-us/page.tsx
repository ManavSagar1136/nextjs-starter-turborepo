import React from "react";
import ContactUsData from "@/data/contact-us";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import ContactUsForm from "@/components/contact-us/ContactUsForm";
import PageWithHeaderFooter from "@/components/layout/PageWithHeaderFooter";

export async function generateMetadata() {
  return generateSEOMetadata({
    title: "Contact Us",
    description: "Contact us for any queries or feedback",
    url: `${SiteConfig.baseUrl}${Routes.contactus}`,
  });
}

const ContactUs = () => {
  return (
    <PageWithHeaderFooter>
      <section className="w-full py-8 md:py-12">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <span className="mk-eyebrow mb-3 block">Contact</span>
            <h1
              className="font-extrabold leading-tight"
              style={{ fontSize: "var(--mk-text-3xl)", color: "var(--mk-text-primary)" }}
            >
              {ContactUsData.headingText}
            </h1>
            <p
              className="mx-auto mt-4 max-w-xl leading-relaxed"
              style={{ fontSize: "var(--mk-text-lg)", color: "var(--mk-text-secondary)" }}
            >
              {ContactUsData.subText}
            </p>
          </div>

          <ContactUsForm
            location={ContactUsData.companyLocation}
            formDetail={ContactUsData.formDetail}
            detail={ContactUsData.detail}
          />
        </div>
      </section>
    </PageWithHeaderFooter>
  );
};

export default ContactUs;
