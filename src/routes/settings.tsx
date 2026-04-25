import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Trash2, Database, Bell, CreditCard } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configuración · VentaFácil" },
      { name: "description", content: "Ajustes generales de la aplicación." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const reset = () => {
    if (confirm("¿Borrar todos los datos locales? Esta acción no se puede deshacer.")) {
      localStorage.removeItem("ventafacil-store");
      toast.success("Datos eliminados. Recargando...");
      setTimeout(() => location.reload(), 800);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Configuración" subtitle="Ajustes generales" back />

      <ul className="mx-5 space-y-2">
        {[
          { icon: Bell, label: "Notificaciones", desc: "Próximamente" },
          { icon: CreditCard, label: "Métodos de pago", desc: "Próximamente" },
          { icon: Database, label: "Respaldo de datos", desc: "Próximamente" },
        ].map((it) => (
          <li
            key={it.label}
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
              <it.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mx-5 mt-6 rounded-3xl bg-card p-5 shadow-card">
        <h3 className="font-display text-base font-bold text-destructive">Zona peligrosa</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Esto eliminará todos los productos, ventas, clientes y proveedores guardados.
        </p>
        <Button
          variant="destructive"
          onClick={reset}
          className="mt-3 w-full rounded-full"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Borrar todos los datos
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        VentaFácil v1.0 — Hecho con ❤️
      </p>
    </AppShell>
  );
}
