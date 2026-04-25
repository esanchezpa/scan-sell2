import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStore, formatPEN } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Facturas · VentaFácil" },
      { name: "description", content: "Gestiona facturas de clientes." },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const invoices = useStore((s) => s.invoices);
  const addInvoice = useStore((s) => s.addInvoice);
  const deleteInvoice = useStore((s) => s.deleteInvoice);

  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [total, setTotal] = useState("");

  const save = () => {
    const t = Number(total);
    if (!number.trim()) return toast.error("Número requerido");
    if (Number.isNaN(t) || t < 0) return toast.error("Total inválido");
    addInvoice({
      number: number.trim(),
      customerName: customer.trim() || "Sin nombre",
      total: t,
      date: new Date().toISOString(),
      status: "Pendiente",
    });
    setNumber("");
    setCustomer("");
    setTotal("");
    setOpen(false);
    toast.success("Factura creada");
  };

  return (
    <AppShell>
      <PageHeader
        title="Facturas"
        subtitle={`${invoices.length} registradas`}
        back
        right={
          <Button
            onClick={() => setOpen(true)}
            className="rounded-full bg-gradient-primary shadow-glow"
          >
            <Plus className="mr-1 h-4 w-4" /> Nueva
          </Button>
        }
      />

      {invoices.length === 0 ? (
        <div className="mx-5 mt-10 text-center text-sm text-muted-foreground">
          Aún no hay facturas.
        </div>
      ) : (
        <ul className="mx-5 space-y-2">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold">{inv.number}</p>
                <p className="text-xs text-muted-foreground">
                  {inv.customerName} ·{" "}
                  {new Date(inv.date).toLocaleDateString("es-PE")}
                </p>
              </div>
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-bold",
                  inv.status === "Pagada"
                    ? "bg-success/15 text-success"
                    : "bg-warning/15 text-warning",
                ].join(" ")}
              >
                {inv.status}
              </span>
              <p className="font-display text-sm font-bold text-primary">
                {formatPEN(inv.total)}
              </p>
              <button
                onClick={() => {
                  deleteInvoice(inv.id);
                  toast.success("Factura eliminada");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Nueva factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Número</Label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="F001-0001"
              />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </div>
            <div>
              <Label>Total (S/)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
