import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  FileText,
  Package,
  ShoppingCart,
  Users,
  Truck,
  UserCog,
  Globe,
  Settings,
  ChevronRight,
  Share2,
  HeadphonesIcon,
} from "lucide-react";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "Más opciones · VentaFácil" },
      { name: "description", content: "Inventario, clientes, proveedores, facturas y más." },
    ],
  }),
  component: MorePage,
});

type MoreItem = {
  to: string;
  label: string;
  icon: typeof Package;
  desc: string;
  star?: boolean;
};
const items: MoreItem[] = [
  { to: "/profile", label: "Mi Perfil", icon: UserCog, desc: "Edita tu nombre de vendedor" },
  { to: "/inventory", label: "Inventario", icon: Package, desc: "Ver y gestionar productos", star: true },
  { to: "/invoices", label: "Facturas", icon: FileText, desc: "Gestionar facturas de clientes" },
  { to: "/purchases", label: "Compras", icon: ShoppingCart, desc: "Órdenes a proveedores", star: true },
  { to: "/customers", label: "Clientes", icon: Users, desc: "Base de datos de clientes" },
  { to: "/suppliers", label: "Proveedores", icon: Truck, desc: "Información de proveedores" },
  { to: "/settings", label: "Configuración", icon: Settings, desc: "Ajustes generales" },
];

function MorePage() {
  return (
    <AppShell>
      <PageHeader
        title="Más"
        subtitle="Gestiona otras áreas de tu negocio"
        right={
          <>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground hover:bg-accent"
              aria-label="Compartir"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success/15 text-success hover:bg-success/25"
              aria-label="Soporte"
            >
              <HeadphonesIcon className="h-5 w-5" />
            </button>
          </>
        }
      />

      <ul className="mx-5 space-y-2">
        {items.map(({ to, label, icon: Icon, desc, star }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition-all hover:shadow-soft"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="flex items-center gap-2 font-display font-semibold">
                  {label}
                  {star && <span className="text-warning">★</span>}
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mx-5 mt-4 overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <p className="font-display text-lg font-bold">Haz crecer tu negocio</p>
        <p className="mt-1 text-sm opacity-90">
          Reportes avanzados, multi-sucursal y más con VentaFácil Pro.
        </p>
        <button className="mt-4 rounded-full bg-warning px-5 py-2 text-sm font-bold text-warning-foreground shadow-soft">
          Prueba Pro gratis →
        </button>
      </div>

      <div className="mx-5 mt-3 flex items-center gap-3 rounded-3xl bg-card p-5 shadow-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Globe className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-primary">web.ventafacil.app</p>
          <p className="font-display text-sm font-bold">Abre VentaFácil en tu computadora</p>
        </div>
      </div>
    </AppShell>
  );
}
