import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mapBarcodeLookupToProduct, useStore, formatPEN, type SaleItem, type Product } from "@/lib/store";
import { api } from "@/lib/api";
import { Search, ScanBarcode, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { BarcodeScanner } from "./BarcodeScanner";
import { toast } from "sonner";
import { useGlobalBarcodeListener } from "@/hooks/useGlobalBarcode";

interface NewSaleDialogProps {
  open: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  onInitialProductConsumed?: () => void;
}

const mapApiProductToCartProduct = (product: any): Product => ({
  id: product.id.toString(),
  name: product.name,
  barcode: product.barcodes?.[0]?.barcode || product.barcode,
  category: product.category_name || "Otros",
  price: product.price,
  cost: product.cost,
  stock: product.stock_quantity || 0,
  lowStockAlert: product.low_stock_threshold,
  imageUrl: product.image_url,
});

export function NewSaleDialog({
  open,
  onClose,
  initialProduct,
  onInitialProductConsumed,
}: NewSaleDialogProps) {
  const products = useStore((s) => s.products);
  const findByBarcode = useStore((s) => s.findByBarcode);
  const customers = useStore((s) => s.customers);
  const addSale = useStore((s) => s.addSale);
  const openProductDialog = useStore((s) => s.openProductDialog);
  const setSaleDialogOpen = useStore((s) => s.setSaleDialogOpen);
  const productDialogOpen = useStore((s) => s.productDialog.open);

  const [query, setQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [payment, setPayment] = useState<"Efectivo" | "Tarjeta" | "Transferencia" | "Crédito">(
    "Efectivo"
  );
  const [customerId, setCustomerId] = useState<string>("none");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      )
      .slice(0, 20);
  }, [products, query]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => {
    setSaleDialogOpen(open);
    return () => setSaleDialogOpen(false);
  }, [open, setSaleDialogOpen]);

  const addItem = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        if (p.stock > 0 && existing.quantity >= p.stock) {
          toast.error(`Solo quedan ${p.stock} unidades`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId, name: p.name, price: p.price, quantity: 1 }];
    });
  };

  const setQty = (productId: string, qty: number) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    if (p.stock > 0 && qty > p.stock) {
      toast.error(`Solo quedan ${p.stock} unidades`);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  };

  const addProductToCart = useCallback((p: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        if (p.stock > 0 && existing.quantity >= p.stock) {
          toast.error(`Solo quedan ${p.stock} unidades`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
  }, []);

  useEffect(() => {
    if (!open || !initialProduct) return;

    addProductToCart(initialProduct);
    toast.success(`Agregado: ${initialProduct.name}`);
    setQuery("");
    searchRef.current?.focus();
    onInitialProductConsumed?.();
  }, [addProductToCart, initialProduct, onInitialProductConsumed, open]);

  useEffect(() => {
    if (!open) return;

    const handleProductSavedForSale = (event: Event) => {
      const product = (event as CustomEvent<Product>).detail;
      if (!product?.id) return;
      addProductToCart(product);
      setQuery("");
      searchRef.current?.focus();
    };

    window.addEventListener("ventafacil:product-saved-for-sale", handleProductSavedForSale);
    return () => {
      window.removeEventListener("ventafacil:product-saved-for-sale", handleProductSavedForSale);
    };
  }, [addProductToCart, open]);

  useGlobalBarcodeListener({
    enabled: open && !scannerOpen && !productDialogOpen,
    onProductFound: (product: any) => {
      const mapped = mapApiProductToCartProduct(product);
      addProductToCart(mapped);
      toast.success(`Agregado: ${mapped.name}`);
      setQuery("");
    },
    onProductNotFound: (barcode: string, productForReactivate?: Product) => {
      if (productForReactivate) {
        openProductDialog({
          mode: "reactivate",
          product: productForReactivate,
          barcode,
          source: "sale",
        });
        setQuery("");
        return;
      }

      if (confirm(`Código "${barcode}" no encontrado. ¿Desea agregarlo como nuevo producto?`)) {
        openProductDialog({
          mode: "create",
          barcode,
          source: "sale",
        });
      }
      setQuery("");
    },
  });

  const lookupBarcode = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length < 8) return;

    const cached = findByBarcode(trimmed);
    if (cached) {
      addItem(cached.id);
      toast.success(`Agregado: ${cached.name}`);
      setQuery("");
      return;
    }

    try {
      const result = await api.barcode.lookup(trimmed);

      if (result.source === "internal") {
        if (result.status === "inactive") {
          const productName = result.name || "este producto";
          if (confirm(`Este código pertenece a un producto eliminado: "${productName}". ¿Deseas reactivar y editar este producto?`)) {
            openProductDialog({
              mode: "reactivate",
              product: mapBarcodeLookupToProduct(result, trimmed),
              barcode: trimmed,
              source: "sale",
            });
          }
          setQuery("");
          return;
        }
        if (result.status === "active" && result.product_id) {
          const mapped = mapBarcodeLookupToProduct(result, trimmed);
          addProductToCart(mapped);
          toast.success(`Agregado: ${mapped.name}`);
          setQuery("");
          return;
        }
        toast.error("Producto no disponible");
        setQuery("");
        return;
      }

      if (result.found) {
        if (confirm(`Código "${trimmed}" encontrado en base de datos externa (${result.source}). ¿Desea agregarlo como nuevo producto?`)) {
          openProductDialog({
            mode: "create",
            barcode: trimmed,
            source: "sale",
          });
        }
        setQuery("");
        return;
      }
    } catch {
      // not found in backend
    }

    if (confirm(`Código "${trimmed}" no encontrado. ¿Desea agregarlo como nuevo producto?`)) {
      openProductDialog({
        mode: "create",
        barcode: trimmed,
        source: "sale",
      });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupBarcode(query);
    }
  };

  const handleScannerDetected = (code: string) => {
    setQuery(code);
    setTimeout(() => lookupBarcode(code), 50);
    setScannerOpen(false);
  };

  const complete = async () => {
    if (!items.length) return;
    const sale = await addSale({
      items,
      total,
      paymentMethod: payment,
      customerId: customerId !== "none" ? customerId : undefined,
      status: "Completada",
    });
    toast.success(`Venta registrada · ${formatPEN(sale.total)}`);
    setItems([]);
    setQuery("");
    setCustomerId("none");
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="flex h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:rounded-3xl">
          <DialogHeader className="border-b border-border bg-gradient-card p-4">
            <DialogTitle className="font-display text-xl text-primary">
              Nueva venta
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Escanea o busca productos para agregarlos al carrito.
            </p>
          </DialogHeader>

          <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
            {/* Search column */}
            <div className="flex flex-col overflow-hidden border-b border-border md:border-b-0 md:border-r">
              <div className="flex items-center gap-2 p-4">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    autoFocus
                    placeholder="Buscar o escanear producto... (Enter)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setScannerOpen(true)}
                  aria-label="Abrir escáner"
                >
                  <ScanBarcode className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
                {filtered.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Sin resultados.
                  </p>
                )}
                {filtered.map((p) => {
                  const inCart = items.some((i) => i.productId === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => addItem(p.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border border-transparent bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft ${
                        inCart ? "border-primary/40 bg-primary-soft/50" : ""
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-display text-lg font-bold text-primary-soft-foreground">
                        {p.imageUrl ? (
                          <img
                            src={api.getImageUrl(p.imageUrl) ?? p.imageUrl}
                            alt=""
                            className="h-full w-full rounded-xl object-cover"
                          />
                        ) : (
                          p.name[0]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPEN(p.price)} · stock: {p.stock}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cart column */}
            <div className="flex flex-col overflow-hidden bg-gradient-card">
              <div className="flex items-center justify-between p-4">
                <h3 className="font-display text-lg font-bold">
                  Carrito{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({items.length})
                  </span>
                </h3>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-2">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <ShoppingBag className="mb-2 h-10 w-10 opacity-30" />
                    El carrito está vacío.
                  </div>
                ) : (
                  items.map((it) => {
                    const p = products.find((x) => x.id === it.productId);
                    const stock = p?.stock ?? 0;
                    const maxed = stock > 0 && it.quantity >= stock;
                    return (
                      <div
                        key={it.productId}
                        className="flex items-center gap-2 rounded-2xl bg-card p-3 shadow-card"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{it.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPEN(it.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-primary-soft p-1">
                          <button
                            onClick={() => setQty(it.productId, it.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary"
                            aria-label="Disminuir"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm font-bold tabular-nums">
                            {it.quantity}
                          </span>
                          <button
                            onClick={() => setQty(it.productId, it.quantity + 1)}
                            disabled={maxed}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary disabled:opacity-30"
                            aria-label="Aumentar"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => setQty(it.productId, 0)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-3 border-t border-border bg-card p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={payment} onValueChange={(v) => setPayment(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Crédito">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    {formatPEN(total)}
                  </span>
                </div>
                <Button
                  onClick={complete}
                  disabled={items.length === 0}
                  className="h-12 w-full rounded-full bg-warning text-warning-foreground shadow-soft hover:bg-warning/90 disabled:opacity-40"
                >
                  Completar venta
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleScannerDetected}
      />
    </>
  );
}
