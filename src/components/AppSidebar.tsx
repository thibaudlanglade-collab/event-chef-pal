import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Users,
  Mail,
  Settings,
  Menu,
  X,
  ContactRound,
  Scale,
  ChevronDown,
  Cog,
  Layers,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoText from "@/assets/logo-text.png";
import { NotificationBell } from "./NotificationBell";
import { useVersion } from "@/contexts/VersionContext";

type NavItem = { title: string; href: string; icon: any };
type NavGroup = { label: string; items: NavItem[] };

const mvpGroups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { title: "Événements", href: "/calendar", icon: CalendarDays },
      { title: "Devis", href: "/quotes", icon: FileText },
      { title: "Équipe", href: "/my-teams", icon: Users },
    ],
  },
];

const advancedItems: NavItem[] = [
  { title: "CRM Pipeline", href: "/crm", icon: ContactRound },
  { title: "Emails IA", href: "/mail", icon: Mail },
  { title: "Comparaison Fournisseurs", href: "/suppliers", icon: Scale },
];

const bottomItems: NavItem[] = [
  { title: "Paramètres", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Principal: true });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const location = useLocation();
  const { version, setVersion, isDeveloped } = useVersion();

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname.startsWith(item.href);
    return (
      <NavLink
        key={item.href}
        to={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-white/15 text-white border-l-2 border-primary ml-0"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/8"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.title}</span>}
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-sidebar-border">
        {collapsed ? (
          <span className="text-lg font-bold text-sidebar-foreground">SLP</span>
        ) : (
          <img src={logoText} alt="Sur le Passe" className="h-8 object-contain brightness-0 invert" />
        )}
      </div>

      {/* Version toggle */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <div className="flex rounded-lg border border-sidebar-border/40 overflow-hidden text-xs">
            <button
              onClick={() => setVersion("mvp")}
              className={cn(
                "flex-1 py-1.5 px-2 font-semibold transition-colors text-center",
                version === "mvp"
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
              )}
            >
              MVP
            </button>
            <button
              onClick={() => setVersion("developed")}
              className={cn(
                "flex-1 py-1.5 px-2 font-semibold transition-colors text-center",
                version === "developed"
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
              )}
            >
              Développé
            </button>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {mvpGroups.map((group) => {
          const isOpen = openGroups[group.label] !== false;
          return (
            <div key={group.label}>
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
                >
                  {group.label}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "" : "-rotate-90")} />
                </button>
              )}
              {(collapsed || isOpen) && (
                <div className="space-y-0.5 mt-1">
                  {group.items.map(renderNavItem)}
                </div>
              )}
            </div>
          );
        })}

        {/* Advanced section — only in Developed */}
        {isDeveloped && (
          <div>
            {!collapsed && (
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Cog className="h-3 w-3" /> Avancé ⚙️
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen ? "" : "-rotate-90")} />
              </button>
            )}
            {(collapsed || advancedOpen) && (
              <div className="space-y-0.5 mt-1">
                {advancedItems.map(renderNavItem)}
              </div>
            )}
          </div>
        )}

        {/* Bottom items (Settings) */}
        <div className="pt-2 border-t border-sidebar-border/30">
          {bottomItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Notification bell + Collapse toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-sidebar-border">
        <NotificationBell />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center p-2 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b border-border/20 bg-sidebar">
        <div className="flex items-center gap-2.5">
          <img src={logoText} alt="Sur le Passe" className="h-7 object-contain brightness-0 invert" />
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground p-1.5"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "hsl(30 15% 12%)" }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
        style={{ background: "hsl(30 15% 12%)" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
