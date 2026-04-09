import { withServerAuth } from "@buildbase/helpers/hoc/withServerAuth";
import { APP_ROLES } from "@buildbase/database/user";
import { Routes } from "@/data/routes";
import { DashboardConfigProvider } from "@buildbase/components";
import { SubscriptionStatusBanner } from "@/components/subscription/SubscriptionStatusBanner";

const menuItemsConfig = [
  {
    title: "Overview",
    url: "#",
    items: [
      {
        title: "Dashboard",
        url: Routes.dashboard,
        iconName: "LayoutDashboard",
      },
    ],
  },
  {
    title: "Content",
    url: "#",
    items: [
      {
        title: "Media Library",
        url: Routes.assets,
        iconName: "Image",
      },
    ],
  },
  {
    title: "Account",
    url: "#",
    items: [
      {
        title: "API Keys",
        url: Routes.apiKeys,
        iconName: "KeyRound",
      },
    ],
  },
];

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardConfigProvider
      menuItemsConfig={menuItemsConfig}
      breadcrumbExcludeSegments={[Routes.dashboard]}
      brand={{
        text: "User",
        href: Routes.dashboard,
      }}
      excludeRoutes={[Routes.login]}
      showTeamSwitcher={true}
    >
      <SubscriptionStatusBanner />
      {children}
    </DashboardConfigProvider>
  );
}

// Apply auth protection to all routes in this group
// Allow both USER and ADMIN roles - admins should also be able to access the user dashboard
export default withServerAuth(ProtectedLayout, {
  redirectTo: Routes.login,
  allowedRoles: [APP_ROLES.USER, APP_ROLES.ADMIN],
});
