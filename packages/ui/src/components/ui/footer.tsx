import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  sections?: FooterSection[];
  socialLinks?: FooterLink[];
  newsletter?: {
    title: string;
    description: string;
    placeholder: string;
    buttonText: string;
    onSubmit?: (email: string) => void;
  };
  copyright?: string;
  className?: string;
  variant?: "default" | "minimal" | "extended";
}

export function Footer({
  sections = [],
  socialLinks = [],
  newsletter,
  copyright = "© 2024 Your Company. All rights reserved.",
  className,
  variant = "default",
}: FooterProps) {
  const [email, setEmail] = React.useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      newsletter?.onSubmit?.(email);
      setEmail("");
    }
  };

  if (variant === "minimal") {
    return (
      <footer className={cn("border-t", className)}>
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-muted-foreground text-sm">{copyright}</p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4">
                {socialLinks.map((link, index) => (
                  <Button key={index} variant="ghost" size="sm" asChild>
                    <a href={link.href} target={link.external ? "_blank" : undefined}>
                      {link.label}
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    );
  }

  if (variant === "extended") {
    return (
      <footer className={cn("bg-muted/50 border-t", className)}>
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold">Your Company</h3>
              <p className="text-muted-foreground mt-2 text-sm">Building amazing products with shadcn/ui components.</p>
              {socialLinks.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {socialLinks.map((link, index) => (
                    <Button key={index} variant="ghost" size="sm" asChild>
                      <a href={link.href} target={link.external ? "_blank" : undefined}>
                        {link.label}
                      </a>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Sections */}
            {sections.map((section, index) => (
              <div key={index}>
                <h4 className="text-sm font-semibold">{section.title}</h4>
                <ul className="mt-4 space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            {newsletter && (
              <div>
                <h4 className="text-sm font-semibold">{newsletter.title}</h4>
                <p className="text-muted-foreground mt-2 text-sm">{newsletter.description}</p>
                <form onSubmit={handleNewsletterSubmit} className="mt-4 space-y-2">
                  <Input
                    type="email"
                    placeholder={newsletter.placeholder}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" size="sm" className="w-full">
                    {newsletter.buttonText}
                  </Button>
                </form>
              </div>
            )}
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-muted-foreground text-sm">{copyright}</p>
            <div className="text-muted-foreground flex gap-4 text-sm">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn("border-t", className)}>
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sections */}
          {sections.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-semibold">{section.title}</h4>
              <ul className="mt-4 space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          {newsletter && (
            <div>
              <h4 className="text-sm font-semibold">{newsletter.title}</h4>
              <p className="text-muted-foreground mt-2 text-sm">{newsletter.description}</p>
              <form onSubmit={handleNewsletterSubmit} className="mt-4 space-y-2">
                <Input
                  type="email"
                  placeholder={newsletter.placeholder}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" className="w-full">
                  {newsletter.buttonText}
                </Button>
              </form>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-muted-foreground text-sm">{copyright}</p>
          {socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map((link, index) => (
                <Button key={index} variant="ghost" size="sm" asChild>
                  <a href={link.href} target={link.external ? "_blank" : undefined}>
                    {link.label}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
