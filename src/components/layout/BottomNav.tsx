import { Link, useLocation } from "@tanstack/react-router";
import { Home, ShoppingBag, LayoutGrid, Menu } from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/sales", label: "Ventas", icon: ShoppingBag },
  { to: "/catalog", label: "Catálogo", icon: LayoutGrid },
  { to: "/more", label: "Más", icon: Menu },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-bottom"
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={[
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  active ? "bg-primary text-primary-foreground shadow-glow" : "",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={["text-[11px] font-semibold tracking-wide", active ? "text-primary" : ""].join(" ")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
