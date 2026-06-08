import { useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Target, BarChart3, Timer } from "lucide-react";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AIChatbot } from "@/components/AIChatbot";
import { UserButton } from "@clerk/react";

const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Goals", url: "/dashboard/goals", icon: Target },
  { title: "Timers", url: "/dashboard/timers", icon: Timer },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="h-14 flex items-center px-6 gap-4 border-b border-border">
        <Link to="/dashboard" className="mr-6 shrink-0">
          <Logo size="sm" />
        </Link>
        <div className="flex-1 flex items-center h-full overflow-x-auto">
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.end}
                className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-full transition-colors hover:text-foreground hover:bg-muted"
                activeClassName="bg-foreground text-background hover:bg-foreground hover:text-background"
              >
                {item.title}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeCustomizer />
          <ThemeToggle />
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </header>
      <main ref={mainRef} className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      <AIChatbot />
    </div>
  );
}

