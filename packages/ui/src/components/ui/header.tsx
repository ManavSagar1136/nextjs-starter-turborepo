import * as React from "react";
import { Menu, X, Search, User, ShoppingCart } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export interface HeaderLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface HeaderProps {
  logo?: {
    text: string;
    href?: string;
    image?: string;
  };
  navigation?: HeaderLink[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
    onSignOut?: () => void;
  };
  search?: {
    placeholder?: string;
    onSearch?: (query: string) => void;
  };
  actions?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "ghost";
  }[];
  className?: string;
  variant?: "default" | "centered" | "minimal";
}

export function Header({
  logo = { text: "Your Brand" },
  navigation = [],
  user,
  search,
  actions = [],
  className,
  variant = "default",
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search?.onSearch?.(searchQuery);
  };

  if (variant === "minimal") {
    return (
      <header
        className={cn("bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur", className)}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              {logo.href ? (
                <a href={logo.href} className="flex items-center space-x-2">
                  {logo.image ? <img src={logo.image} alt={logo.text} className="h-8 w-8" /> : null}
                  <span className="text-xl font-bold">{logo.text}</span>
                </a>
              ) : (
                <div className="flex items-center space-x-2">
                  {logo.image ? <img src={logo.image} alt={logo.text} className="h-8 w-8" /> : null}
                  <span className="text-xl font-bold">{logo.text}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <Button key={index} variant={action.variant || "outline"} size="sm" asChild={!!action.href}>
                  {action.href ? (
                    <a href={action.href}>{action.label}</a>
                  ) : (
                    <button onClick={action.onClick}>{action.label}</button>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (variant === "centered") {
    return (
      <header
        className={cn("bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur", className)}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              {logo.href ? (
                <a href={logo.href} className="flex items-center space-x-2">
                  {logo.image ? <img src={logo.image} alt={logo.text} className="h-8 w-8" /> : null}
                  <span className="text-xl font-bold">{logo.text}</span>
                </a>
              ) : (
                <div className="flex items-center space-x-2">
                  {logo.image ? <img src={logo.image} alt={logo.text} className="h-8 w-8" /> : null}
                  <span className="text-xl font-bold">{logo.text}</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="hidden items-center space-x-8 md:flex">
              {navigation.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <Button key={index} variant={action.variant || "outline"} size="sm" asChild={!!action.href}>
                  {action.href ? (
                    <a href={action.href}>{action.label}</a>
                  ) : (
                    <button onClick={action.onClick}>{action.label}</button>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn("bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur", className)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            {logo.href ? (
              <a href={logo.href} className="flex items-center space-x-2">
                {logo.image ? <img src={logo.image} alt={logo.text} className="h-8 w-8" /> : null}
                <span className="text-xl font-bold">{logo.text}</span>
              </a>
            ) : (
              <div className="flex items-center space-x-2">
                {logo.image ? <img src={logo.image} alt={logo.text} className="h-8 w-8" /> : null}
                <span className="text-xl font-bold">{logo.text}</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            {navigation.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Search */}
          {search && (
            <div className="hidden items-center lg:flex">
              <form onSubmit={handleSearch} className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="search"
                  placeholder={search.placeholder || "Search..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
              </form>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button key={index} variant={action.variant || "outline"} size="sm" asChild={!!action.href}>
                {action.href ? (
                  <a href={action.href}>{action.label}</a>
                ) : (
                  <button onClick={action.onClick}>{action.label}</button>
                )}
              </Button>
            ))}

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map(n => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-muted-foreground w-[200px] truncate text-sm">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={user.onSignOut}>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="mt-4 flex flex-col space-y-4">
                  {navigation.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
