import React from "react";
import ContactUsData from "@/data/contact-us";
import { Routes } from "@/data/routes";
import { generateSEOMetadata } from "@/utils/seo";
import { SiteConfig } from "@/config";

import ContactUsForm from "@/components/contact-us/ContactUsForm";
import { HeaderCard } from "@buildbase/components/common/header-card";
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
      <section className="space-y-6 py-16">
        <HeaderCard
          mainTitle={ContactUsData.headingText}
          subTitle={ContactUsData.subText}
          button={false}
          h1
        />
        <ContactUsForm
          location={ContactUsData.companyLocation}
          formDetail={ContactUsData.formDetail}
          detail={ContactUsData.detail}
        />
      </section>
    </PageWithHeaderFooter>
  );
};

export default ContactUs;
