import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStore, formatPEN, type Customer } from "@/lib/store";
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
import { Plus, Trash2, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Clientes · VentaFácil" },
      { name: "description", content: "Administra tu base de clientes." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useStore((s) => s.customers);
  const addCustomer = useStore((s) => s.addCustomer);
  const deleteCustomer = useStore((s) => s.deleteCustomer);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
  };

  const save = () => {
    if (name.trim().length < 3) {
      toast.error("Nombre muy corto");
      return;
    }
    addCustomer({ name: name.trim(), phone: phone.trim(), email: email.trim(), credit: 0 });
    toast.success("Cliente agregado");
    reset();
    setOpen(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Clientes"
        subtitle={`${customers.length} registrados`}
        back
        right={
          <Button
            onClick={() => setOpen(true)}
            className="rounded-full bg-gradient-primary shadow-glow"
          >
            <Plus className="mr-1 h-4 w-4" /> Nuevo
          </Button>
        }
      />

      {customers.length === 0 ? (
        <div className="mx-5 mt-10 text-center text-sm text-muted-foreground">
          Aún no hay clientes.
        </div>
      ) : (
        <ul className="mx-5 space-y-2">
          {customers.map((c: Customer) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {c.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </span>
                  )}
                  {c.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {c.email}
                    </span>
                  )}
                </p>
              </div>
              {c.credit > 0 && (
                <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-warning">
                  Debe {formatPEN(c.credit)}
                </span>
              )}
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar "${c.name}"?`)) {
                    deleteCustomer(c.id);
                    toast.success("Cliente eliminado");
                  }
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
            <DialogTitle className="font-display text-xl text-primary">Nuevo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cn">Nombre</Label>
              <Input id="cn" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cp">Teléfono</Label>
              <Input id="cp" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ce">Email</Label>
              <Input id="ce" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
