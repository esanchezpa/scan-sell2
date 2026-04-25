import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStore, formatPEN } from "@/lib/store";
import { AlertTriangle, Package } from "lucide-react";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventario · VentaFácil" },
      { name: "description", content: "Resumen de inventario y alertas de stock." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const products = useStore((s) => s.products);

  const stats = useMemo(() => {
    const value = products.reduce((s, p) => s + p.cost * p.stock, 0);
    const low = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAlert).length;
    const out = products.filter((p) => p.stock === 0).length;
    const total = products.reduce((s, p) => s + p.stock, 0);
    return { value, low, out, total };
  }, [products]);

  return (
    <AppShell>
      <PageHeader title="Inventario" subtitle="Resumen y alertas" back />

      <section className="mx-5 mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <p className="text-xs opacity-80">Valor del inventario</p>
          <p className="font-display text-xl font-bold">{formatPEN(stats.value)}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Total unidades</p>
          <p className="font-display text-xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-2xl bg-warning/10 p-4">
          <p className="text-xs font-medium text-warning">Stock bajo</p>
          <p className="font-display text-xl font-bold text-warning">{stats.low}</p>
        </div>
        <div className="rounded-2xl bg-destructive/10 p-4">
          <p className="text-xs font-medium text-destructive">Agotados</p>
          <p className="font-display text-xl font-bold text-destructive">{stats.out}</p>
        </div>
      </section>

      <section className="mx-5 rounded-3xl bg-card p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-primary">Productos</h2>
        <ul className="mt-3 space-y-2">
          {products.map((p) => {
            const isLow = p.stock > 0 && p.stock <= p.lowStockAlert;
            const isOut = p.stock === 0;
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                  <Package className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold">{p.stock} uds</p>
                  {isOut && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                      <AlertTriangle className="mr-0.5 inline h-2.5 w-2.5" /> Agotado
                    </span>
                  )}
                  {isLow && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                      Bajo
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <Link
          to="/catalog"
          className="mt-4 block rounded-full bg-primary-soft py-3 text-center text-sm font-semibold text-primary-soft-foreground"
        >
          Ir al catálogo →
        </Link>
      </section>
    </AppShell>
  );
}
