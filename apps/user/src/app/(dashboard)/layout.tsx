import { withServerAuth } from "@buildbase/helpers/hoc/withServerAuth";
import { APP_ROLES } from "@buildbase/database/user";
import { Routes } from "@/data/routes";
import { DashboardConfigProvider } from "@buildbase/components";

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
        title: "Profile",
        url: Routes.profile,
        iconName: "User",
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
      profileRoute={Routes.profile}
      excludeRoutes={[Routes.login]}
    >
      {children}
    </DashboardConfigProvider>
  );
}

// Apply auth protection to all routes in this group
export default withServerAuth(ProtectedLayout, {
  redirectTo: Routes.login,
  allowedRoles: [APP_ROLES.USER],
});
