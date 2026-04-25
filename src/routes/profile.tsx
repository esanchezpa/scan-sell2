import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Mi perfil · VentaFácil" },
      { name: "description", content: "Edita tu información de vendedor." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const vendor = useStore((s) => s.vendorName);
  const setVendor = useStore((s) => s.setVendorName);
  const store = useStore((s) => s.storeName);
  const setStore = useStore((s) => s.setStoreName);

  const [v, setV] = useState(vendor);
  const [n, setN] = useState(store);

  const save = () => {
    setVendor(v.trim() || "Vendedor");
    setStore(n.trim() || "Mi Tienda");
    toast.success("Perfil actualizado");
  };

  return (
    <AppShell>
      <PageHeader title="Mi Perfil" subtitle="Edita tu nombre y tu tienda" back />
      <div className="mx-5 space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary text-4xl shadow-glow">
            👤
          </div>
        </div>
        <div>
          <Label htmlFor="vendor">Nombre del vendedor</Label>
          <Input id="vendor" value={v} onChange={(e) => setV(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="store">Nombre de la tienda</Label>
          <Input id="store" value={n} onChange={(e) => setN(e.target.value)} />
        </div>
        <Button onClick={save} className="w-full rounded-full shadow-soft">
          Guardar cambios
        </Button>
      </div>
    </AppShell>
  );
}
