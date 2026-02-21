import { NavLink, Outlet } from "react-router-dom";
import {
  Home,
  FileText,
  Calendar,
  Settings,
  Bell,
  ClipboardList,
  Users,
  ChevronLeft,
  ChevronRight,
  Palmtree,
  LogOut,
  BarChart3,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, profile, signOut } = useAuth();
  const isMobile = useIsMobile();

  const navItems = [
    { to: "/", icon: Home, label: "首頁", end: true, show: true },
    { to: "/request-leave", icon: FileText, label: "申請休假", show: true },
    { to: "/leave-calendar", icon: Calendar, label: "休假日曆", show: true },
    { to: "/admin", icon: Settings, label: "管理後台", show: isAdmin },
    { to: "/leave-balance", icon: BarChart3, label: "休假餘額", show: isAdmin },
    { to: "/leave-policies", icon: ClipboardList, label: "休假條件", show: isAdmin },
    { to: "/employee-management", icon: Users, label: "員工管理", show: isAdmin },
    { to: "/notification-settings", icon: Bell, label: "通知設置", show: isAdmin },
    { to: "/user-guide", icon: BookOpen, label: "操作指南", show: true },
  ];

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Palmtree className="h-5 w-5" />
        </div>
        {(!collapsed || isMobile) && <span className="text-lg font-semibold tracking-tight">休假系統</span>}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-sidebar-foreground/70">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems
          .filter((i) => i.show)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        {(!collapsed || isMobile) && profile && (
          <div className="px-3 py-1">
            <p className="text-sm font-medium truncate">{profile.name}</p>
            <p className="text-xs text-sidebar-foreground/50">{isAdmin ? "管理員" : "員工"}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={(collapsed && !isMobile) ? "icon" : "default"}
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobile) && <span>登出</span>}
        </Button>
      </div>

      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 px-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Palmtree className="h-5 w-5" />
          <span className="font-semibold">休假系統</span>
        </header>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute left-0 top-0 h-full w-64 flex flex-col bg-sidebar text-sidebar-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
            collapsed ? "w-16" : "w-60"
          )}
        >
          {sidebarContent}
        </aside>
      )}

      <main className={cn(
        "flex-1 transition-all duration-300",
        isMobile ? "mt-14" : (collapsed ? "ml-16" : "ml-60")
      )}>
        <Outlet />
      </main>
    </div>
  );
}
