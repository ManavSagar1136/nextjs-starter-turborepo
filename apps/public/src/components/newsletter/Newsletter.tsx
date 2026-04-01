"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon, ChevronRightIcon } from "lucide-react";

import { withPostLaunchOnly } from "@/components/hoc/launch/withLaunchStatus";
import { AnimatedSubscribeButton } from "@buildbase/magicui/components/animated-subscribe-button";
import { Input } from "@buildbase/ui/input";

import useSendNewsletterEmail from "@/hooks/use-send-newsletter-email";
import { useToast } from "@buildbase/ui/hooks/use-toast";
import { getMotionVariant, fadeUp } from "@/lib/animation-variants";

interface IFormDetail {
  email: string;
}

const ACTION_DURATION = 5000;

const NewsletterComponent = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { sendNewsletterEmail, isLoading } = useSendNewsletterEmail();
  const [success, setSuccess] = useState<boolean>(false);
  const shouldReduce = useReducedMotion();

  const headlineVariant = getMotionVariant(shouldReduce, fadeUp);

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
    <section
      className="w-full py-20 md:py-32 px-5 md:px-20 bg-white dark:bg-dark-surface"
      aria-label="Newsletter signup"
    >
      <motion.div
        variants={headlineVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-[600px] text-center"
      >
        <span className="mk-eyebrow mb-3 block">Newsletter</span>
        <h2
          className="mb-4 font-bold leading-tight text-2xl md:text-3xl text-slate-900 dark:text-slate-50"
        >
          Stay in the loop.
        </h2>
        <p
          className="mb-8 leading-relaxed text-base text-slate-600 dark:text-slate-400"
        >
          Get the latest updates, tutorials, and releases delivered to your inbox.
        </p>

        <div className="mx-auto flex max-w-[420px] flex-col items-center gap-3 sm:flex-row">
          <Input
            type="email"
            placeholder="you@company.com"
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm bg-slate-100 dark:bg-dark-surface-elevated border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50"
            value={email}
            disabled={isLoading}
            onChange={(e) => setEmail(e.target.value)}
          />

          <AnimatedSubscribeButton
            className="min-w-[130px]"
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
      </motion.div>
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
