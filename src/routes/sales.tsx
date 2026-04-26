import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStore, formatPEN, type Sale } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { NewSaleDialog } from "@/components/NewSaleDialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Ventas · VentaFácil" },
      { name: "description", content: "Punto de venta e historial de ventas." },
    ],
  }),
  component: SalesPage,
});

function SaleDetailDialog({ sale, open, onClose }: { sale: Sale | null; open: boolean; onClose: () => void }) {
  const products = useStore((s) => s.products);

  if (!sale) return null;

  const date = new Date(sale.date);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">
            Detalle de venta
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {date.toLocaleDateString("es-PE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-primary">
                {formatPEN(sale.total)}
              </p>
              <p className="text-xs text-muted-foreground">{sale.paymentMethod}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-muted-foreground">
              Productos ({sale.items.length})
            </p>
            <ul className="space-y-2">
              {sale.items.map((item, idx) => {
                const product = products.find((p) => p.id === item.productId);
                const imageUrl = product?.imageUrl;
                return (
                  <li key={idx} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary-soft-foreground overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={api.getImageUrl(imageUrl) ?? imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        item.name[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPEN(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-display font-semibold text-primary">
                      {formatPEN(item.price * item.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPEN(sale.total)}</span>
            </div>
            <div className="mt-1 flex justify-between font-semibold">
              <span>Total</span>
              <span className="font-display text-primary">{formatPEN(sale.total)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SalesPage() {
  const sales = useStore((s) => s.sales);
  const deleteSale = useStore((s) => s.deleteSale);
  const customers = useStore((s) => s.customers);
  const storeName = useStore((s) => s.storeName);
  const [openSale, setOpenSale] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setSelectedSale(s)}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("¿Eliminar esta venta?")) {
                        deleteSale(s.id);
                        toast.success("Venta eliminada");
                      }
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
      <SaleDetailDialog sale={selectedSale} open={!!selectedSale} onClose={() => setSelectedSale(null)} />
    </AppShell>
  );
}
