import { SidebarNav } from "./sidebar-nav";
import LayoutSidebar from "@/components/organisms/layout-sidebar";
import { useTranslations } from "next-intl";

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
  },
  {
    title: "Account",
    href: "/settings/account",
  },
  {
    title: "Storage",
    href: "/settings/storage",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    disabled: true,
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("settings");
  return (
    <LayoutSidebar title={t("title")}>
    <div className="">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
    </LayoutSidebar>
  );
}
