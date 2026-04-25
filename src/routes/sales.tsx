import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStore, formatPEN } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { NewSaleDialog } from "@/components/NewSaleDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Ventas · VentaFácil" },
      { name: "description", content: "Punto de venta e historial de ventas." },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const sales = useStore((s) => s.sales);
  const deleteSale = useStore((s) => s.deleteSale);
  const customers = useStore((s) => s.customers);
  const storeName = useStore((s) => s.storeName);
  const [openSale, setOpenSale] = useState(false);

  return (
    <AppShell>
      <PageHeader
        title={storeName}
        subtitle="Punto de venta"
        right={
          <Button
            onClick={() => setOpenSale(true)}
            className="rounded-full bg-gradient-primary shadow-glow"
          >
            <Plus className="mr-1 h-4 w-4" /> Nueva venta
          </Button>
        }
      />

      {sales.length === 0 ? (
        <div className="mx-5 mt-12 flex flex-col items-center text-center">
          <div className="mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-primary-soft text-7xl">
            🧾
          </div>
          <p className="text-lg font-medium text-muted-foreground">Sin ventas todavía</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra tu primera venta para verla aquí.
          </p>
          <Button
            onClick={() => setOpenSale(true)}
            className="mt-6 h-12 rounded-full bg-gradient-primary px-8 shadow-glow"
          >
            <ShoppingBag className="mr-2 h-5 w-5" /> Registrar primera venta
          </Button>
        </div>
      ) : (
        <ul className="mx-5 space-y-3">
          {sales.map((s) => {
            const c = customers.find((x) => x.id === s.customerId);
            const date = new Date(s.date);
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {s.items.length} producto(s) · {s.paymentMethod}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {date.toLocaleDateString("es-PE")}{" "}
                    {date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                    {c && ` · ${c.name}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold text-primary">
                    {formatPEN(s.total)}
                  </p>
                  <button
                    onClick={() => {
                      deleteSale(s.id);
                      toast.success("Venta eliminada");
                    }}
                    className="mt-1 text-xs text-destructive hover:underline"
                  >
                    <Trash2 className="inline h-3 w-3" /> Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NewSaleDialog open={openSale} onClose={() => setOpenSale(false)} />
    </AppShell>
  );
}
