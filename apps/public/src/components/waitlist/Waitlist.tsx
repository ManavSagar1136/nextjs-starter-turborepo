"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ChevronRightIcon } from "lucide-react";

import { withPreLaunchOnly } from "@/components/hoc/launch/withLaunchStatus";
import { AnimatedSubscribeButton } from "@buildbase/magicui/components/animated-subscribe-button";
import { Input } from "@buildbase/ui/input";

import useSendWaitingListSubscriptionEmail from "@/hooks/use-send-waitlist-email";
import { useToast } from "@buildbase/ui/hooks/use-toast";

interface IFormDetail {
  email: string;
}

const ACTION_DURATION = 5000;

const WaitlistComponent = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { sendWailtinglistEmail, isLoading } = useSendWaitingListSubscriptionEmail();
  const [success, setSuccess] = useState<boolean>(false);

  const tempError = useMemo(() => {
    return validateInputObject({ email });
  }, [email]);

  const onAddToWaitlist = () => {
    // e.preventDefault();
    // if using captcha then
    // make token as required parameter
    // make method async/promise
    // do call validateCaptcha and then call axios api.
    if (tempError.email.length === 0) {
      try {
        sendWailtinglistEmail(
          {
            email: email.toString(),
          },
          () => {
            setSuccess(true);
            toast({
              title: "Success",
              description: "You've been added to the waitlist!",
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
    <section id="waitlist" className="flex scroll-m-20 flex-col items-center">
      <div className="from-brand-100 to-brand-300 w-full max-w-4xl rounded-lg bg-gradient-to-r p-8 text-center md:p-12">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">You caught us before we&apos;re ready.</h2>
          <p className="text-gray-700">
            We&apos;re working hard on the finishing touches.
            <br />
            If you&apos;d like us to send you a reminder when we&apos;re ready, just put your email below.
          </p>
          <div className="align-center mx-auto flex w-full flex-col content-center items-center justify-center gap-4 md:flex-row">
            <Input
              type="email"
              placeholder="john@doe.com"
              className="focus:ring-brand-400 w-auto rounded-md border px-4 py-2 focus:outline-none focus:ring-2 dark:bg-white dark:text-black"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <AnimatedSubscribeButton
              className="min-w-36"
              isLoading={isLoading}
              isSubscribed={success}
              onClick={onAddToWaitlist}
            >
              <span className="group inline-flex items-center">
                Remind me
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
      {/* <Dialog open={success} onOpenChange={() => setSuccess(false)}>
        <DialogContent className="!z-[10000] w-full max-w-sm md:max-w-3xl">
          <DialogTitle className="sr-only">Waitlist</DialogTitle>
          <DialogDescription className="flex flex-col items-center justify-center gap-1">
            <Check className="h-36 w-36 font-extrabold text-green-800" />
            <div className="flex flex-col gap-1 text-center leading-tight">
              <h3 className="text-2xl font-semibold capitalize text-primary md:text-3xl">
                🎉 You&apos;re on the Waitlist!
              </h3>
              <p className="pt-3 text-base text-primary/50 md:text-xl">
                Thank you for signing up! We&apos;re thrilled to have you on
                board.
              </p>
              <p className="text-base text-primary/50 md:text-xl">
                Keep an eye on your inbox for updates and the latest news.
                We&apos;re excited to share what&apos;s next with you!
              </p>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog> */}
    </section>
  );
};

export const Waitlist = withPreLaunchOnly(WaitlistComponent);

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
