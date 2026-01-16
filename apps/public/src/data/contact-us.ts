const ContactUsData = {
  headingText: "Get in Touch with Us!",
  subText: [
    "We're here to help—reach out for solutions tailored to grow your business.",
  ],
  detail: [
    {
      id: "location",
      description: "Company Address at specific location inside map",
      icon: "/icon/location-icon.svg",
      href: "https://maps.app.goo.gl/hy173t4yqpnAYorJ6",
    },
    {
      id: "email",
      description: "support@company.org",
      icon: "/icon/email-icon.svg",
      href: "mailto:support@company.org",
    },
    {
      id: "mobileNumber",
      description: "Let's talk on phone",
      icon: "/icon/mobile-icon.svg",
      href: "tel:+01333444555",
    },
  ],
  formDetail: [
    {
      id: "first-name",
      placeholder: "First Name",
      name: "firstName",
      type: "text",
    },
    {
      id: "last-name",
      name: "lastName",
      placeholder: "Last Name",
      type: "text",
    },
    {
      id: "email",
      name: "email",
      placeholder: "Email Address",
      type: "text",
    },
    {
      id: "contact number",
      name: "contactNumber",
      placeholder: "Mobile Number",
      type: "text",
    },
    {
      id: "message",
      placeholder: "Write your message here...",
      name: "message",
      type: "textarea",
    },
  ],
  companyLocation: {
    src: "/company-location/map.png",
    link: "https://maps.app.goo.gl/hy173t4yqpnAYorJ6",
  },
};

export default ContactUsData;
