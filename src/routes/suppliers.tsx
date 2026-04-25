import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStore } from "@/lib/store";
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
import { Plus, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Proveedores · VentaFácil" },
      { name: "description", content: "Información de tus proveedores." },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const suppliers = useStore((s) => s.suppliers);
  const addSupplier = useStore((s) => s.addSupplier);
  const deleteSupplier = useStore((s) => s.deleteSupplier);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");

  const save = () => {
    if (name.trim().length < 3) {
      toast.error("Nombre muy corto");
      return;
    }
    addSupplier({ name: name.trim(), contact: contact.trim(), phone: phone.trim() });
    toast.success("Proveedor agregado");
    setName("");
    setContact("");
    setPhone("");
    setOpen(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Proveedores"
        subtitle={`${suppliers.length} registrados`}
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

      <ul className="mx-5 space-y-2">
        {suppliers.map((s) => (
          <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.contact} {s.phone && `· ${s.phone}`}
              </p>
            </div>
            <button
              onClick={() => {
                deleteSupplier(s.id);
                toast.success("Proveedor eliminado");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Nuevo proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Empresa</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Contacto</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
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
