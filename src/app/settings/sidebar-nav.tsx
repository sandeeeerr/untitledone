"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SidebarNavItem {
  href: string;
  title: string;
  disabled?: boolean;
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)}
      {...props}>
      {items.map((item) => {
        if (item.disabled) {
          return (
            <div
              key={item.href}
              aria-disabled
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start opacity-50 cursor-not-allowed"
              )}
            >
              {item.title}
            </div>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              pathname === item.href ? "bg-muted hover:bg-muted" : "hover:bg-muted",
              "justify-start"
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
