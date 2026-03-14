"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  Landmark,
  LayoutDashboard,
  Menu,
  Settings2,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { href: "/capital", label: "Capital", icon: Landmark },
  { href: "/operations", label: "Operations", icon: Settings2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/portal", label: "Investor Portal", icon: UsersRound },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const currentPath = useMemo(() => pathname ?? "/dashboard", [pathname]);

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`ui-sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="ui-sidebar hidden min-h-screen shrink-0 lg:flex lg:flex-col">
      <div className="ui-divider border-b p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-[color:var(--text-secondary)] uppercase">
          Fund Intelligence
        </p>
        <p className="mt-1 text-base font-semibold text-[color:var(--text-primary)]">Maybern Suite</p>
      </div>
      <div className="p-4">
        <NavLinks />
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        className="ui-btn ui-btn-secondary inline-flex items-center gap-2 px-3 py-2 lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="ui-overlay fixed inset-0 z-50 lg:hidden">
          <div className="ui-surface h-full w-[260px] p-4 shadow-[0px_10px_25px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">Navigation</p>
              <button
                type="button"
                aria-label="Close navigation"
                className="ui-btn ui-btn-ghost inline-flex items-center px-2 py-2"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
