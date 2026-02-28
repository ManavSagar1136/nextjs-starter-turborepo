"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

// import { Dialog, DialogContent, DialogDescription } from "@buildbase/ui/dialog";
import { Button } from "@buildbase/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@buildbase/ui/dialog";
import { Input } from "@buildbase/ui/input";
import { Textarea } from "@buildbase/ui/textarea";

import useSendContactUsEmail from "@/hooks/use-send-contact-us-email";
import { useToast } from "@buildbase/ui/hooks/use-toast";

interface IFormDetail {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  message: string;
  [x: string]: string;
}

export interface Details {
  id: string;
  description: string;
  icon: string;
  href: string;
}

export interface formDetail {
  id: string;
  placeholder: string;
  name: string;
  type: string;
}

const formDefaultValue: IFormDetail = {
  firstName: "",
  lastName: "",
  contactNumber: "",
  email: "",
  message: "",
};
const ContactUsForm = ({
  location,
  formDetail,
  detail,
}: {
  location: {
    src: string;
    link: string;
  };
  formDetail: formDetail[];
  detail: Details[];
}) => {
  const [inputObject, setInputObject] = useState<IFormDetail>(formDefaultValue);
  const [error, setError] = useState<IFormDetail>(formDefaultValue);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();
  const { sendContactUsEmail, isLoading } = useSendContactUsEmail();

  const handleInputChange = (e: any) => {
    setInputObject({ ...inputObject, [e.target.name]: e.target.value });
    setError({
      ...error,
      [e.target.name]:
        e.target.value === "" ? `*${e.target.name} required` : "",
    });
  };

  async function handleFormSubmit(e: any) {
    e.preventDefault();
    const tempError = validateInputObject(inputObject);
    if (
      tempError.contactNumber.length === 0 &&
      tempError.email.length === 0 &&
      tempError.firstName.length === 0 &&
      tempError.lastName.length === 0 &&
      tempError.message.length === 0
    ) {
      try {
        sendContactUsEmail(
          {
            firstName: inputObject.firstName.toString(),
            lastName: inputObject.lastName.toString(),
            contactNumber: `M:${inputObject.contactNumber.toString()}`,
            email: inputObject.email.toString(),
            message: inputObject.message.toString(),
            subject: `Contact us form submission from ${inputObject.email}`,
          },
          () => {
            setSuccess(true);
            toast({
              title: "Success",
              description: "Your data was sent successfully.",
              variant: "default",
              duration: 5000,
            });
            setSuccess(true);
            setInputObject(formDefaultValue);
          },
          () => {
            toast({
              title: "Uh oh! Something went wrong.",
              description: "There was a problem with your request.",
              variant: "destructive",
              duration: 5000,
            });
          },
        );
      } catch (e) {
        console.error(e);
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } else {
      setError(tempError);
    }
  }

  return (
    <div
      className="grid w-full grid-cols-1 gap-5 lg:gap-8 rounded-[20px] px-6 py-8 md:grid-cols-2 md:p-8 lg:p-20 bg-slate-50 dark:bg-dark-surface-secondary border border-slate-200 dark:border-slate-800"
    >
      <div className="flex flex-col gap-5">
        <h2
          className="text-center text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50"
        >
          Reach out by filling the form.
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
          {formDetail.map((data) => {
            return (
              <div
                className={`${
                  data.type === "textarea" ? "md:col-span-2" : ""
                } `}
                key={data.id}
              >
                {data.type === "text" && (
                  <Input
                    type={data.type}
                    id="outlined-basic"
                    name={data.name}
                    value={inputObject[data.name]}
                    onChange={handleInputChange}
                    placeholder={data.placeholder}
                    className="w-full placeholder:text-[16px] focus:outline-none bg-slate-100 dark:bg-dark-surface-elevated border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50"
                  />
                )}

                {data.type === "textarea" && (
                  <Textarea
                    id="outlined-basic"
                    rows={7}
                    name={data.name}
                    placeholder={data.placeholder}
                    value={inputObject.message}
                    onChange={handleInputChange}
                    className="mt-5 w-full placeholder:text-[16px] focus:outline-none bg-slate-100 dark:bg-dark-surface-elevated border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50"
                  />
                )}
                {error[data.name] && typeof error[data.name] === 'string' && error[data.name]!.length > 0 && (
                  <div className="relative">
                    <div className="absolute text-xs text-red-500">
                      {error[data.name]}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-500"
          onClick={handleFormSubmit}
          disabled={isLoading}
          style={{ boxShadow: "0 0 32px rgba(99, 102, 241, 0.15)" }}
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>

        <div className="flex flex-col gap-4 py-4">
          {detail.map((data) => {
            return (
              <div key={data.id}>
                {data.description !== "" && (
                  <Link
                    href={data.href}
                    key={data.id}
                    className="flex gap-2 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors duration-200"
                    target="_blank"
                  >
                    <img
                      src={data.icon}
                      alt={data.id}
                      title={data.id}
                      height={24}
                      width={24}
                    />
                    <p>{data.description}</p>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Link className="flex" href={location.link} target="_blank">
        <img
          src={location.src}
          className="h-full w-full rounded-[20px] object-cover"
          alt="company location"
          title="company location"
          height="auto"
          width="auto"
        />
      </Link>

      <Dialog open={success} onOpenChange={() => setSuccess(false)}>
        <DialogContent className="!z-[10000] w-full max-w-sm md:max-w-3xl">
          <DialogTitle className="sr-only">Contact Us</DialogTitle>
          <div className="flex flex-col items-center justify-center gap-1">
            <Check className="h-36 w-36 font-extrabold text-emerald-600 dark:text-emerald-400" />
            <div className="flex flex-col gap-1 text-center leading-tight">
              <h3
                className="text-2xl font-semibold capitalize md:text-3xl text-slate-900 dark:text-slate-50"
              >
                Message Sent!
              </h3>
              <DialogDescription
                className="pt-3 text-base md:text-xl text-slate-600 dark:text-slate-400"
              >
                Thank you for reaching out to us! Your message has been
                successfully sent.
                <br />
                Our team will review your inquiry and get back to you as soon as
                possible. We appreciate your patience!
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactUsForm;

function validateInputObject(text: IFormDetail) {
  const errors = {
    firstName: "",
    lastName: "",
    contactNumber: "",
    email: "",
    message: "",
  };
  const emailregex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (text.firstName.trim().length === 0) {
    errors.firstName = "*FirstName required";
  } else {
    errors.firstName = "";
  }
  if (text.lastName.trim().length === 0) {
    errors.lastName = "*LastName required";
  } else {
    errors.lastName = "";
  }
  if (text.contactNumber.trim().length === 0) {
    errors.contactNumber = "*Number required";
  } else if (text.contactNumber.length < 7 || text.contactNumber.length > 13) {
    errors.contactNumber = "*Enter Valid number";
  } else if (isNaN(parseInt(text.contactNumber))) {
    errors.contactNumber = "*Enter Valid number";
  }

  if (text.email.trim().length === 0) {
    errors.email = "*Email required";
  }

  if (emailregex.test(text.email) === false && text.email.length !== 0) {
    errors.email = "*Email be in test@example.com this format";
  }

  if (text.message.trim().length === 0) {
    errors.message = "*Message required";
  } else if (text.message.length < 20) {
    errors.message = "*Enter Valid Message (min 20 characters)";
  } else {
    errors.message = "";
  }
  return errors;
}
