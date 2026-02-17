import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Users,
  Package,
  // ChefHat removed — using logo image
  Menu,
  X,
  Mail,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const navItems = [
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { title: "Calendrier", href: "/calendar", icon: CalendarDays },
  { title: "Devis", href: "/quotes", icon: FileText },
  { title: "Équipe", href: "/team", icon: Users },
  { title: "Stock", href: "/stock", icon: Package },
  { title: "Mails", href: "/mail", icon: Mail },
  { title: "Paramètres", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
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
      </nav>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center p-3 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b border-primary/20 bg-gradient-to-r from-primary to-[hsl(263,70%,58%)]"
      >
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
