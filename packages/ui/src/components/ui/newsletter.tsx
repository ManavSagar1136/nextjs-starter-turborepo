import * as React from "react";
import { Mail, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface NewsletterProps {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  onSubmit?: (email: string) => void;
  className?: string;
  variant?: "default" | "card" | "inline";
  showIcon?: boolean;
}

export function Newsletter({
  title = "Stay updated",
  description = "Get the latest news and updates delivered to your inbox.",
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  onSubmit,
  className,
  variant = "default",
  showIcon = true,
}: NewsletterProps) {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.(email);
      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        {showIcon && (
          <div className="flex items-center gap-2">
            <Mail className="text-primary h-5 w-5" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}
        {!showIcon && <h3 className="text-lg font-semibold">{title}</h3>}
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      </form>
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder={placeholder}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {buttonText}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-64"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              buttonText
            )}
          </Button>
        </form>
      </div>
    );
  }

  return <div className={cn("w-full max-w-md", className)}>{content}</div>;
}
