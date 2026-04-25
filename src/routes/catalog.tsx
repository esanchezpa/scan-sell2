import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useStore, formatPEN, type Product } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ScanBarcode, Plus, Pencil, Trash2 } from "lucide-react";
import { ProductDialog } from "@/components/ProductDialog";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { toast } from "sonner";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catálogo · VentaFácil" },
      { name: "description", content: "Gestiona los productos de tu tienda." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const products = useStore((s) => s.products);
  const findByBarcode = useStore((s) => s.findByBarcode);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode?.includes(q)
    );
  }, [products, query]);

  const onAdd = () => {
    setEditing(undefined);
    setOpen(true);
  };

  const onEdit = (p: Product) => {
    setEditing(p);
    setOpen(true);
  };

  return (
    <AppShell>
      <header className="px-5 pb-4 pt-4 text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-primary">
          Catálogo
        </h1>
      </header>

      <div className="mx-5 mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-2xl bg-primary-soft pl-9"
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="h-11 w-11 rounded-2xl bg-primary-soft text-primary-soft-foreground"
          onClick={() => setScannerOpen(true)}
          aria-label="Escanear"
        >
          <ScanBarcode className="h-5 w-5" />
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="mx-5 mt-10 text-center text-sm text-muted-foreground">
          {query ? "Sin resultados" : "Aún no hay productos. Agrega uno."}
        </div>
      ) : (
        <ul className="mx-5 space-y-2">
          {filtered.map((p) => {
            const isLow = p.stock > 0 && p.stock <= p.lowStockAlert;
            const isOut = p.stock === 0;
            return (
              <li
                key={p.id}
                className="group flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card transition-shadow hover:shadow-soft"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-soft font-display text-2xl font-bold text-primary-soft-foreground">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    p.name[0].toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => onEdit(p)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="truncate font-semibold">{p.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatPEN(p.price)} / pza.</span>
                    {isOut && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-bold text-destructive">
                        Agotado
                      </span>
                    )}
                    {isLow && (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 font-bold text-warning">
                        Stock bajo · {p.stock}
                      </span>
                    )}
                    {!isLow && !isOut && <span>Stock: {p.stock}</span>}
                  </div>
                </button>
                <button
                  onClick={() => onEdit(p)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary-soft"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar "${p.name}"?`)) {
                      deleteProduct(p.id);
                      toast.success("Producto eliminado");
                    }
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        onClick={onAdd}
        aria-label="Añadir producto"
        className="fixed bottom-24 right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-gradient-primary px-5 text-primary-foreground shadow-glow transition-transform hover:scale-105 sm:right-[calc(50%-18rem)]"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
        <span className="pr-1 font-semibold">Añadir producto</span>
      </button>

      <ProductDialog open={open} onClose={() => setOpen(false)} initial={editing} />
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          const found = findByBarcode(code);
          if (found) {
            onEdit(found);
            toast.success(`Producto encontrado: ${found.name}`);
          } else {
            toast.message("Código no registrado", {
              description: "Se abrirá el formulario para crearlo.",
            });
            setEditing({
              id: "",
              name: "",
              barcode: code,
              category: "Otros",
              price: 0,
              cost: 0,
              stock: 0,
              lowStockAlert: 5,
            } as Product);
            setOpen(true);
          }
        }}
      />
    </AppShell>
  );
}
