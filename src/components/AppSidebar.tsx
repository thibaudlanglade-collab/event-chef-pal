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
  Megaphone,
  Scale,
  FileEdit,
  ChevronDown,
  FolderOpen,
  History,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { NotificationBell } from "./NotificationBell";

type NavGroup = {
  label: string;
  items: { title: string; href: string; icon: any }[];
};

const navGroups: NavGroup[] = [
  {
    label: "Gestion",
    items: [
      { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { title: "Calendrier", href: "/calendar", icon: CalendarDays },
      { title: "📧 Boîte mail IA", href: "/mail", icon: Mail },
      { title: "Historique emails", href: "/emails/history", icon: History },
      { title: "Devis express", href: "/quotes", icon: FileText },
      { title: "CRM", href: "/crm", icon: ContactRound },
      { title: "Dossier événement", href: "/event-dossier", icon: FolderOpen },
    ],
  },
  {
    label: "Prépa équipe",
    items: [
      { title: "Mes équipes", href: "/my-teams", icon: Users },
      { title: "Annonces", href: "/announcements", icon: Megaphone },
    ],
  },
  {
    label: "Organisation",
    items: [
      { title: "Comparaison Fournisseurs", href: "/suppliers", icon: Scale },
      { title: "Brief Maître d'Hôtel", href: "/brief", icon: FileEdit },
      { title: "Templates checklist", href: "/settings/checklist-templates", icon: ClipboardList },
    ],
  },
];

const bottomItems = [
  { title: "Paramètres", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Gestion: true, "Prépa équipe": true, Organisation: true });
  const location = useLocation();

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img src={logo} alt="CaterPilot" className="h-9 w-9 rounded-xl object-contain shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            CaterPilot
          </span>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.label] !== false;
          const hasActive = group.items.some((item) => location.pathname.startsWith(item.href));

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
                  {group.items.map((item) => {
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
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom items (Settings) */}
        <div className="pt-2 border-t border-sidebar-border/30">
          {bottomItems.map((item) => {
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
          })}
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b border-primary/20 bg-gradient-to-r from-primary to-[hsl(263,70%,58%)]">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="CaterPilot" className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-base font-bold text-sidebar-foreground">CaterPilot</span>
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
        style={{ background: "linear-gradient(180deg, hsl(239 84% 67%), hsl(263 70% 50%))" }}
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
        style={{ background: "linear-gradient(180deg, hsl(239 84% 67%), hsl(263 70% 50%))" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
