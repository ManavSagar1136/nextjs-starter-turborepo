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
    title: "User Management",
    url: "#",
    items: [
      {
        title: "Users",
        url: Routes.users,
        iconName: "Users",
      },
      {
        title: "Workspaces",
        url: Routes.workspaces,
        iconName: "Building2",
      },
    ],
  },
  {
    title: "Email Management",
    url: "#",
    items: [
      {
        title: "Email Providers",
        url: Routes.email.providers,
        iconName: "Mail",
      },
      {
        title: "Email Templates",
        url: Routes.email.templates,
        iconName: "FileText",
      },
      {
        title: "Sent Emails",
        url: Routes.email.sent,
        iconName: "Send",
      },
      {
        title: "Email Stats",
        url: Routes.email.stats,
        iconName: "BarChart3",
      },
    ],
  },
  {
    title: "Asset Management",
    url: "#",
    items: [
      {
        title: "Assets",
        url: Routes.assets,
        iconName: "Image",
      },
    ],
  },
  {
    title: "Blog Management",
    url: "#",
    items: [
      {
        title: "Blog Posts",
        url: Routes.blogs.posts,
        iconName: "FileText",
      },
      {
        title: "Blog Folders",
        url: Routes.blogs.folders,
        iconName: "FolderOpen",
      },
      {
        title: "Blog Tags",
        url: Routes.blogs.tags,
        iconName: "Tag",
      },
      {
        title: "Blog Authors",
        url: Routes.blogs.authors,
        iconName: "Users",
      },
    ],
  },
  {
    title: "Docs Management",
    url: "#",
    items: [
      {
        title: "Doc Posts",
        url: Routes.docs.posts,
        iconName: "BookOpen",
      },
      {
        title: "Doc Folders",
        url: Routes.docs.folders,
        iconName: "FolderOpen",
      },
    ],
  },
  {
    title: "Changelog Management",
    url: "#",
    items: [
      {
        title: "Changelogs",
        url: Routes.changelogs.posts,
        iconName: "History",
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
        text: "Admin",
        href: Routes.dashboard,
      }}
      showProfile={false}
      excludeRoutes={[Routes.login]}
    >
      {children}
    </DashboardConfigProvider>
  );
}

// Apply auth protection to all routes in this group
export default withServerAuth(ProtectedLayout, {
  redirectTo: Routes.login,
  allowedRoles: [APP_ROLES.ADMIN],
});
