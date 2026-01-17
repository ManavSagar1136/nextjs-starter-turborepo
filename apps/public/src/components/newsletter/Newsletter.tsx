"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronRightIcon } from "lucide-react";

import { withPostLaunchOnly } from "@/components/hoc/launch/withLaunchStatus";
import { AnimatedSubscribeButton } from "@buildbase/magicui/components/animated-subscribe-button";
import { Input } from "@buildbase/ui/input";

import useSendNewsletterEmail from "@/hooks/use-send-newsletter-email";
import { useToast } from "@buildbase/ui/hooks/use-toast";

interface IFormDetail {
  email: string;
}

const ACTION_DURATION = 5000;

const NewsletterComponent = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { sendNewsletterEmail, isLoading } = useSendNewsletterEmail();
  const [success, setSuccess] = useState<boolean>(false);

  const tempError = useMemo(() => {
    return validateInputObject({ email });
  }, [email]);

  const onSubscribeToNewsletter = () => {
    if (tempError.email.length === 0) {
      try {
        sendNewsletterEmail(
          {
            email: email.toString(),
          },
          () => {
            setSuccess(true);
            toast({
              title: "Success",
              description: "You've been subscribed to our newsletter!",
              variant: "default",
              duration: ACTION_DURATION,
            });
            setEmail("");
            setTimeout(() => {
              setSuccess(false);
            }, ACTION_DURATION);
          },
          () => {
            setSuccess(false);
            toast({
              title: "Uh oh! Something went wrong.",
              description: "Something went wrong. Please try again later.",
              variant: "destructive",
              duration: ACTION_DURATION,
            });
          }
        );
      } catch (e) {
        console.error(e);
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
          variant: "destructive",
          duration: ACTION_DURATION,
        });
      }
    } else {
      toast({
        title: "Uh oh! fields are not correct.",
        description: tempError.email,
        variant: "destructive",
        duration: ACTION_DURATION,
      });
    }
  };

  return (
    <section className="mb-40 mt-20 flex flex-col items-center">
      <div className="from-brand-100 to-brand-300 w-full max-w-4xl rounded-lg bg-gradient-to-r p-8 text-center md:p-12">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Stay Updated with Our Newsletter</h2>
          <p className="text-gray-700">
            Get the latest insights, tutorials, and updates delivered directly to your inbox. Join thousands of
            subscribers who trust our content.
          </p>
          <div className="align-center mx-auto flex w-full flex-col content-center items-center justify-center gap-4 md:flex-row">
            <Input
              type="email"
              placeholder="john@doe.com"
              className="flex max-w-80 flex-1 rounded-md px-4 py-2 dark:bg-white dark:text-black"
              value={email}
              disabled={isLoading}
              onChange={e => setEmail(e.target.value)}
            />

            <AnimatedSubscribeButton
              className="min-w-36"
              isLoading={isLoading}
              isSubscribed={success}
              onClick={onSubscribeToNewsletter}
            >
              <span className="group inline-flex items-center">
                Subscribe
                <ChevronRightIcon className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <span className="group inline-flex items-center">
                <CheckIcon className="mr-2 size-4" />
                Subscribed
              </span>
            </AnimatedSubscribeButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Newsletter = withPostLaunchOnly(NewsletterComponent);

function validateInputObject(text: IFormDetail) {
  const errors = {
    firstName: "",
    lastName: "",
    contactNumber: "",
    email: "",
    message: "",
  };
  const emailregex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  if (text.email.trim().length === 0) {
    errors.email = "*Email required";
  }

  if (emailregex.test(text.email) === false && text.email.length !== 0) {
    errors.email = "*Email be in test@example.com this format";
  }

  return errors;
}
