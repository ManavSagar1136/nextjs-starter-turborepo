"use client";

import { useCallback, useState } from "react";

import { API } from "@/services";

import { SiteConfig } from "@/config";

interface IValues {
  [key: string]: string;
}

export default function useSendContactUsEmail() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const SITE_URL = SiteConfig.baseUrl;

  const generateThankYouEmailHTML = useCallback(
    (values: IValues) => {
      return `<html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thanks for Contacting Us</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            background-color: #fff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: auto;
          }
          .header {
            text-align: center;
            padding: 10px 0;
          }
          .header img {
            max-width: 100%;
            margin-bottom: 10px;
          }
          h1 {
            color: #0e7dc2;
            font-size: 24px;
          }
          p {
            font-size: 16px;
            margin: 10px 0;
          }
          a {
            color: #FFFFFF !important;
            text-decoration: none !important;
          }
          hover:a {
            color: #FFFFFF !important;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #0e7dc2;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            margin-top: 20px;
            text-align: left;
            font-size: 0.9em;
            color: #777;
          }
        img {
          object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${SITE_URL}/logo.jpg" alt="App Logo" height="56px" width="245px" />
            <h1>Thanks for contacting us</h1>
          </div>
          <p>Hi ${values?.firstName ?? ""} ${values?.lastName ?? ""},</p>
          <p>Thank you for reaching out to us. We have received your message and our team will get back to you shortly.</p>
          <p>If you have any urgent queries, feel free to contact us directly via email or phone.</p>
          <a href="${SITE_URL}" class="button">
            Explore Our Website
          </a>
          <br/>
          <a href="${SITE_URL}/blogs" class="button">
            Explore Our Latest Blog Posts
          </a>
          <div class="footer">
            <p>Thanks,<br/>Company Team</p>
          </div>
        </div>
      </body>
      </html>`;
    },
    [SITE_URL],
  );

  const generateInfoEmailHTML = useCallback(
    (values: IValues) => {
      return `<html lang="en"> 
      <head> 
        <meta charset="UTF-8"> 
        <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
        <title>Contact Form Submission</title> 
        <style> 
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 20px; 
          } 
          .container { 
            background-color: #fff; 
            padding: 20px; 
            border-radius: 5px; 
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); 
            max-width: 600px; 
            margin: auto; 
          } 
          .logo { 
            text-align: center; 
            margin-bottom: 20px; 
          } 
          .logo img { 
            max-width: 200px; 
          } 
          h2 { 
            color: #4CAF50; 
            text-align: center; 
            margin-bottom: 20px;
          } 
          p { 
            margin: 10px 0; 
          } 
          .footer { 
            margin-top: 20px; 
            text-align: center; 
            font-size: 0.9em; 
            color: #777; 
          } 
        </style> 
      </head> 
      <body> 
        <div class="container"> 
          <div class="logo"> 
            <img src="${SITE_URL}/logo.jpg" alt="App Logo" /> 
          </div> 
          <h2>New Contact Form Submission</h2> 
          <p><strong>First Name:</strong> ${values?.firstName ?? "-"}</p> 
          <p><strong>Last Name:</strong> ${values?.lastName ?? "-"}</p> 
          <p><strong>Phone Number:</strong> ${values?.contactNumber ?? "-"}</p> 
          <p><strong>Email:</strong> ${values?.email ?? "-"}</p> 
          <p><strong>Subject:</strong> ${values?.subject ?? "-"}</p> 
          <p><strong>Message:</strong></p> 
          <p>${values?.message ?? "-"}</p> 
          <div class="footer"> 
            <p>This message was sent from your website's contact form.</p> 
          </div> 
        </div> 
      </body> 
    </html>`;
    },
    [SITE_URL],
  );

  const sendContactUsEmail = async (
    values: IValues,
    onSuccess: () => void,
    onError: () => void,
  ) => {
    setIsLoading(true);

    const html = {
      thankYouHTML: generateThankYouEmailHTML(values),
      infoHTML: generateInfoEmailHTML(values),
    };

    try {
      const response = await API.contact.sendContactUsEmail({
        firstName: values.firstName || "",
        lastName: values.lastName || "",
        contactNumber: values.contactNumber || "",
        email: values.email || "" ,
        message: values.message || "",
        subject: values.subject || `Contact us form submission from ${values.email}`,
      });
      console.log("sendEmail response", response);
      onSuccess();
    } catch (error) {
      console.error("Error: ", error);
      onError();
    } finally {
      setIsLoading(false);
    }
  };

  return { sendContactUsEmail, isLoading };
}
