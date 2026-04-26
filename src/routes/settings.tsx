import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Trash2, Database, Bell, CreditCard, Accessibility } from "lucide-react";
import { Slider } from "@/components/ui/slider";

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
  const accessibilityScale = useStore((s) => s.accessibilityScale);
  const setAccessibilityScale = useStore((s) => s.setAccessibilityScale);

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

      <div className="mx-5 space-y-3">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
              <Accessibility className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-semibold">Accesibilidad</p>
              <p className="text-xs text-muted-foreground">Escala de zoom y tamaño</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Zoom: {Math.round(accessibilityScale * 100)}%</span>
              <button
                onClick={() => setAccessibilityScale(1)}
                className="text-xs text-primary underline"
              >
                Restablecer
              </button>
            </div>
            <Slider
              min={0.85}
              max={1.2}
              step={0.05}
              value={[accessibilityScale]}
              onValueChange={([v]) => setAccessibilityScale(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>85%</span>
              <span>120%</span>
            </div>
          </div>
        </div>

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
      </div>

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