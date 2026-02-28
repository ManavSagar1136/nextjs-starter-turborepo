"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Mail, Send } from "lucide-react";

import { Badge } from "@buildbase/ui/components/ui/badge";
import { Button } from "@buildbase/ui/components/ui/button";
import { Card, CardContent } from "@buildbase/ui/components/ui/card";
import { Input } from "@buildbase/ui/components/ui/input";

import { cn } from "@buildbase/ui/lib/utils";
import { useSubscribeNewsletter } from "@/hooks/use-subscribe-newsletter";

interface BlogNewsletterProps {
  className?: string;
}

export function BlogNewsletter({ className }: BlogNewsletterProps) {
  const [email, setEmail] = useState("");
  const { subscribe, isLoading, isSubscribed } = useSubscribeNewsletter();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    await subscribe({
      email,
      onSuccess: () => {
        setEmail("");
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn("w-full", className)}
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-indigo-500/10">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-y-12 -translate-x-12" />

        <CardContent className="relative p-6 sm:p-8 lg:p-12">
          <div className="text-center space-y-6">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="bg-indigo-500/50 text-white border-indigo-500/30 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/50 px-4 py-2">
                <Mail className="h-3 w-3 mr-2" />
                Newsletter
              </Badge>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 dark:from-slate-50 to-slate-900/70 dark:to-slate-50/70 bg-clip-text text-transparent"
            >
              Stay Updated
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-400 dark:text-slate-600 max-w-2xl mx-auto"
            >
              Get the latest insights, tutorials, and updates delivered directly
              to your inbox. Join thousands of developers and designers who
              trust our content.
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-4 text-sm text-slate-400 dark:text-slate-600"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Weekly insights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No spam, ever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Unsubscribe anytime</span>
              </div>
            </motion.div>

            {/* Subscription Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              onSubmit={handleSubscribe}
              className="max-w-md mx-auto space-y-4"
            >
              {!isSubscribed ? (
                <div className="flex gap-x-2 gap-y-3 max-sm:flex-col">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white/80 dark:bg-white/10 backdrop-blur-sm border-slate-100 dark:border-dark-surface-elevated"
                    required
                  />
                  <Button type="submit" disabled={isLoading} className="px-6">
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <>
                        Subscribe
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 px-4 py-3 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Successfully subscribed!</span>
                </motion.div>
              )}
            </motion.form>

            {/* Privacy Notice */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="text-xs text-slate-400 dark:text-slate-600"
            >
              By subscribing, you agree to our{" "}
              <Link
                href="/privacy"
                className="underline hover:text-indigo-500 transition-colors"
              >
                Privacy Policy
              </Link>{" "}
              and consent to receive marketing communications.
            </motion.p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
