import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStore } from "@/lib/store";
import { ShoppingCart, Truck } from "lucide-react";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Compras · VentaFácil" },
      { name: "description", content: "Órdenes de compra a proveedores." },
    ],
  }),
  component: PurchasesPage,
});

function PurchasesPage() {
  const suppliers = useStore((s) => s.suppliers);
  return (
    <AppShell>
      <PageHeader title="Compras" subtitle="Órdenes a proveedores" back />
      <div className="mx-5 mt-2 flex flex-col items-center text-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary-soft text-6xl">
          📦
        </div>
        <p className="mt-4 font-display text-lg font-bold text-primary">
          Próximamente
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Genera órdenes a tus proveedores y registra mercadería que llegará a tu tienda.
        </p>
      </div>

      <section className="mx-5 mt-6 rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 text-primary">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="font-display text-lg font-bold">Tus proveedores</h2>
        </div>
        <ul className="mt-3 space-y-2">
          {suppliers.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3"
            >
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{s.name}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/suppliers"
          className="mt-4 block rounded-full bg-primary-soft py-3 text-center text-sm font-semibold text-primary-soft-foreground"
        >
          Gestionar proveedores →
        </Link>
      </section>
    </AppShell>
  );
}
