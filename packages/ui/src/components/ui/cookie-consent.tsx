import * as React from "react";
import { X, Cookie, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/ui-switch";
import { Separator } from "@/components/ui/separator";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface CookieConsentProps {
  onAccept: (preferences: CookiePreferences) => void;
  onReject?: () => void;
  className?: string;
  showSettings?: boolean;
}

export function CookieConsent({ onAccept, onReject, className, showSettings = true }: CookieConsentProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [showPreferences, setShowPreferences] = React.useState(false);
  const [preferences, setPreferences] = React.useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    onAccept(allAccepted);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    onReject?.();
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    onAccept(preferences);
    setIsVisible(false);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === "necessary") return; // Can't disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!isVisible) return null;

  return (
    <div className={cn("fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-2xl", className)}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            <CardTitle className="text-lg">Cookie Preferences</CardTitle>
          </div>
          <CardDescription>
            We use cookies to enhance your experience and analyze our traffic. Choose your preferences below.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!showPreferences ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleAcceptAll} className="flex-1">
                Accept All
              </Button>
              {showSettings && (
                <Button variant="outline" onClick={() => setShowPreferences(true)} className="flex-1">
                  <Settings className="mr-2 h-4 w-4" />
                  Customize
                </Button>
              )}
              <Button variant="outline" onClick={handleRejectAll} className="flex-1">
                Reject All
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Necessary Cookies</h4>
                    <p className="text-muted-foreground text-sm">Essential for the website to function properly</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Analytics Cookies</h4>
                    <p className="text-muted-foreground text-sm">
                      Help us understand how visitors interact with our website
                    </p>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={checked => handlePreferenceChange("analytics", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Cookies</h4>
                    <p className="text-muted-foreground text-sm">
                      Used to track visitors across websites for advertising
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={checked => handlePreferenceChange("marketing", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Preference Cookies</h4>
                    <p className="text-muted-foreground text-sm">Remember your settings and preferences</p>
                  </div>
                  <Switch
                    checked={preferences.preferences}
                    onCheckedChange={checked => handlePreferenceChange("preferences", checked)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSavePreferences} className="flex-1">
                  Save Preferences
                </Button>
                <Button variant="outline" onClick={() => setShowPreferences(false)} className="flex-1">
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
