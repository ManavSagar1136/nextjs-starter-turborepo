import React from "react";
import Link from "next/link";
import { Routes } from "@/data/routes";
import { THEME_COLOR } from "@/utils/colors";
import { Menu } from "lucide-react";

import { Button } from "@buildbase/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@buildbase/ui/components/ui/sheet";

import { SiteConfig } from "@/config";

import { HEADER_KEYS, NAVIGATION_ITEMS } from ".";
import { Logo } from "@/components/logo/Logo";
import { SparklesText } from "@buildbase/components/common/sparkles-text";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@buildbase/ui/accordion";
import { ScrollArea } from "@buildbase/ui/components/ui/scroll-area";
import { JoinWaitlistButton } from "@/components/waitlist/JoinWaitlistButton";
import BlogDropdownContent from "./BlogDropdownContent";
import DocsDropdownContent from "./DocsDropdownContent";
import { ThemeToggle } from "@buildbase/ui/components/ui/theme-toggle";

interface IHeaderSideMenubarProps extends React.ComponentProps<typeof Sheet> {
  onGetStartedClick: () => void;
  isLoadingCta: boolean;
  isLoginLoading: boolean;
  isLogged: boolean;
  isProductLive: boolean;
}

const HeaderSideMenubar: React.FC<IHeaderSideMenubarProps> = ({
  open,
  onOpenChange,
  onGetStartedClick,
  isLoadingCta,
  isLoginLoading,
  isLogged,
  isProductLive,
  ...props
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} {...props}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="lg:hidden" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="scroll-parent p-0 gap-0">
        <SheetHeader className="space-y-2 border-b p-3">
          <SheetTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-8 h-8 mr-2 overflow-hidden">
                  <Logo />
                </div>
                <Link href={Routes.root} className="font-extrabold">
                  {SiteConfig.name}
                </Link>
              </div>
              {isProductLive && <ThemeToggle />}
            </div>
          </SheetTitle>
          {isProductLive && (
            <Button
              size="sm"
              onClick={onGetStartedClick}
              disabled={isLoadingCta || isLoginLoading}
              progress={isLoginLoading}
            >
              {isLogged ? "Go to app" : "Get started"}
            </Button>
          )}
        </SheetHeader>
        <ScrollArea>
          <Accordion type="multiple" className="w-full flex flex-col gap-4 p-4">
            {NAVIGATION_ITEMS.filter((item) =>
              item.requiresProductLive ? isProductLive : true,
            ).map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-none"
              >
                {item.hasDropdown ? (
                  <>
                    <AccordionTrigger className="py-0 hover:no-underline text-base">
                      {item.href ? (
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent accordion toggle when clicking link
                            onOpenChange?.(false);
                          }}
                          className="font-normal"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="font-normal">{item.label}</span>
                      )}
                    </AccordionTrigger>
                    <AccordionContent className="py-0">
                      {(() => {
                        switch (item.key) {
                          case HEADER_KEYS.BLOGS:
                            return (
                              <BlogDropdownContent
                                isMobile={true}
                                onLinkClick={() => onOpenChange?.(false)}
                              />
                            );
                          case HEADER_KEYS.DOCS:
                            return (
                              <DocsDropdownContent
                                isMobile={true}
                                onLinkClick={() => onOpenChange?.(false)}
                              />
                            );
                          default:
                            return null;
                        }
                      })()}
                    </AccordionContent>
                  </>
                ) : item.href ? (
                  <Link href={item.href} onClick={() => onOpenChange?.(false)}>
                    {item.isSparkles ? (
                      <SparklesText
                        text={item.label}
                        sparklesCount={3}
                        colors={{
                          first: THEME_COLOR[200],
                          second: THEME_COLOR[900],
                        }}
                      />
                    ) : (
                      item.label
                    )}
                  </Link>
                ) : (
                  <span>
                    {item.isSparkles ? (
                      <SparklesText
                        text={item.label}
                        sparklesCount={3}
                        colors={{
                          first: THEME_COLOR[200],
                          second: THEME_COLOR[900],
                        }}
                      />
                    ) : (
                      item.label
                    )}
                  </span>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
        {!isProductLive && (
          <div className="flex border-t p-4 *:w-full *:max-w-72 *:mx-auto">
            <JoinWaitlistButton
              closeMenu={true}
              onMenuClose={() => onOpenChange?.(false)}
              size="lg"
              className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default HeaderSideMenubar;
