// Common components - export both named and default exports
export { PageError } from "./common/PageError";

export { CustomImage, getImageURL } from "./common/custom-image";

export { HeaderCard, HeadingTag } from "./common/header-card";
export { default as HeaderCardDefault } from "./common/header-card";

export { FeatureLine } from "./common/feature-line";
export { default as FeatureLineDefault } from "./common/feature-line";

export { DocHeaders } from "./common/doc-headers";
export { default as DocHeadersDefault } from "./common/doc-headers";

export { HeroBgWrapper } from "./common/hero-bg-wrapper";
export { default as HeroBgWrapperDefault } from "./common/hero-bg-wrapper";

export { SparklesSiteNameText } from "./common/SparklesSiteNameText";

export { SparklesText } from "./common/sparkles-text";

export { NotLoggedIn } from "./common/NotLoggedIn";
export { default as NotLoggedInDefault } from "./common/NotLoggedIn";

export { AppIcon } from "./common/AppIcon";
export { default as AppIconDefault } from "./common/AppIcon";

export { GoogleAnalytics } from "./common/GoogleAnalytics";

// Dashboard components
export { DashboardLayout } from "./dashboard/dashboard-layout";
export { ConditionalDashboardLayout } from "./dashboard/conditional-dashboard-layout";
export { DashboardConfigProvider } from "./dashboard/dashboard-config-provider";
export { NavMain } from "./dashboard/nav-main";
export { NavUser } from "./dashboard/nav-user";
export { DashboardBreadcrumb } from "./dashboard/dashboard-breadcrumb";
export type { MenuItem, DashboardLayoutProps } from "./dashboard/types";
export type { NavUserProps } from "./dashboard/nav-user";

// Email components
export { EmailTemplateForm } from "./email/email-template-form";
export type { EmailTemplateFormProps, EmailTemplateFormData } from "./email/email-template-form";
export { EmailProviderForm } from "./email/email-provider-form";
export type { EmailProviderFormProps, EmailProviderFormData } from "./email/email-provider-form";
export { UnlayerEditor } from "./email/unlayer-editor";
export type { UnlayerEditorProps } from "./email/unlayer-editor";
