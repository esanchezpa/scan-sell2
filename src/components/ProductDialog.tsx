import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore, type Product, type ProductCategory } from "@/lib/store";
import { api, BUSINESS_ID, STORE_ID } from "@/lib/api";
import { Camera, ScanBarcode, Sparkles, Loader2, ImagePlus, X } from "lucide-react";
import { BarcodeScanner } from "./BarcodeScanner";
import { toast } from "sonner";

const categories: ProductCategory[] = [
  "Bebidas",
  "Snacks",
  "Abarrotes",
  "Limpieza",
  "Cuidado Personal",
  "Otros",
];

interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: Product;
  barcode?: string;
}

export function ProductDialog({ open, onClose, initial, barcode: barcodeProp }: ProductDialogProps) {
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const initialize = useStore((s) => s.initialize);

  const [name, setName] = useState(initial?.name ?? "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [category, setCategory] = useState<ProductCategory>(initial?.category ?? "Otros");
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [cost, setCost] = useState(String(initial?.cost ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? ""));
  const [alert, setAlert] = useState(String(initial?.lowStockAlert ?? "5"));
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrlPath, setImageUrlPath] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");
  const [barcodeChecking, setBarcodeChecking] = useState(false);
  const [barcodeChanged, setBarcodeChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletedProductId, setDeletedProductId] = useState<number | null>(null);
  const [reactivatedProduct, setReactivatedProduct] = useState<Product | null>(null);
  const [pendingReactivationId, setPendingReactivationId] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "reactivate">("create");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offLookupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialBarcodeRef = useRef(initial?.barcode);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setBarcodeError("");
      setBarcodeChecking(false);
      setBarcodeChanged(false);
      setImageUploading(false);
      setSubmitting(false);
      setAiLoading(false);
      setDeletedProductId(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (offLookupRef.current) clearTimeout(offLookupRef.current);
    } else {
      setName(initial?.name ?? "");
      setBarcode(initial?.barcode ?? barcodeProp ?? "");
      setCategory(initial?.category ?? "Otros");
      setCategoryId(initial?.categoryId ?? null);
      setPrice(String(initial?.price ?? ""));
      setCost(String(initial?.cost ?? ""));
      setStock(String(initial?.stock ?? ""));
      setAlert(String(initial?.lowStockAlert ?? "5"));
      const fullUrl = api.getImageUrl(initial?.imageUrl ?? "") ?? initial?.imageUrl ?? "";
      setImageUrl(fullUrl);
      setImageUrlPath(initial?.imageUrl ?? "");
      initialBarcodeRef.current = initial?.barcode ?? barcodeProp ?? "";
      setBarcodeChanged(false);
      setDeletedProductId(null);
      setReactivatedProduct(null);
      setPendingReactivationId(null);
      setDialogMode(initial ? "edit" : "create");
      setBarcodeError("");
      setBarcodeChecking(false);
      setBarcodeChanged(false);
      setAiLoading(false);
      setImageUploading(false);
      setSubmitting(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (offLookupRef.current) clearTimeout(offLookupRef.current);

      if (!initial && barcodeProp && barcodeProp.trim()) {
        if (offLookupRef.current) clearTimeout(offLookupRef.current);
        offLookupRef.current = setTimeout(() => lookupBarcodeInfo(barcodeProp), 100);
      }
    }
  }, [open, initial, barcodeProp]);

  const lookupBarcodeInfo = async (code: string) => {
    if (!code.trim() || initial) return;
    setAiLoading(true);
    setImageUploading(false);
    try {
      const result = await api.barcode.lookup(code.trim());

      if (result.source === "internal") {
        if (result.status === "active") {
          toast.info("Este producto ya existe en tu catálogo");
          setAiLoading(false);
          setImageUploading(false);
          return;
        }
        if (result.status === "inactive") {
          setDialogMode("reactivate");
          setPendingReactivationId(result.product_id);
          setBarcodeError("");
          setDeletedProductId(null);
          setBarcodeChanged(false);
          initialBarcodeRef.current = code.trim();
          if (result.name != null) setName(result.name);
          setCategoryId(result.category_id ?? null);
          if (result.category_name != null) {
            const matched = categories.find(c => c.toLowerCase() === result.category_name!.toLowerCase());
            if (matched) setCategory(matched);
          }
          if (result.image_url) {
            setImageUrl(result.image_url);
            setImageUrlPath(result.image_url);
          }
          if (result.price != null) setPrice(String(result.price));
          if (result.cost != null) setCost(String(result.cost));
          if (result.stock_quantity != null) setStock(String(result.stock_quantity));
          if (result.low_stock_threshold != null) setAlert(String(result.low_stock_threshold));
          setAiLoading(false);
          return;
        }
      }

      if (!result.found) {
        toast.error("Producto no encontrado");
        setAiLoading(false);
        setImageUploading(false);
        return;
      }

      setDialogMode("create");
      setCategoryId(result.category_id ?? null);
      if (result.name != null) setName(result.name);
      if (result.category_name != null) {
        const matched = categories.find(c => c.toLowerCase() === result.category_name!.toLowerCase());
        if (matched) setCategory(matched);
      }
      if (result.image_url) {
        setImageUrl(result.image_url);
        setImageUrlPath(result.image_url);
      }
    } catch (err) {
      console.error("Barcode lookup failed:", err);
      toast.error("Error al buscar información del producto");
    } finally {
      setAiLoading(false);
      setImageUploading(false);
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      lookupBarcodeInfo(barcode);
      barcodeInputRef.current?.blur();
    }
  };

  const handleBarcodeBlur = () => {
    if (barcode.trim() && !barcodeError && !initial) {
      lookupBarcodeInfo(barcode);
    }
  };

  useEffect(() => {
    const trimmed = barcode.trim();
    if (dialogMode === "reactivate") {
      setBarcodeError("");
      setBarcodeChecking(false);
      setDeletedProductId(null);
      return;
    }
    if (!trimmed) {
      setBarcodeError("");
      setBarcodeChecking(false);
      setBarcodeChanged(false);
      setDeletedProductId(null);
      return;
    }
    const isChanged = initialBarcodeRef.current !== trimmed;
    setBarcodeChanged(isChanged);
    if (!isChanged) {
      setBarcodeError("");
      setBarcodeChecking(false);
      setDeletedProductId(null);
      return;
    }
    setBarcodeChecking(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.products.barcodeExists(trimmed);
        if (res.exists) {
          if (res.is_deleted) {
            setBarcodeError("Este código pertenece a un producto eliminado");
            setDeletedProductId(res.product_id);
          } else {
            setBarcodeError("Este código ya está registrado");
            setDeletedProductId(null);
          }
        } else {
          setBarcodeError("");
          setDeletedProductId(null);
        }
      } catch {
        setBarcodeError("");
        setDeletedProductId(null);
      } finally {
        setBarcodeChecking(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [barcode, dialogMode]);

  const reset = () => {
    setName("");
    setBarcode("");
    setCategory("Otros");
    setCategoryId(null);
    setPrice("");
    setCost("");
    setStock("");
    setAlert("5");
    setImageUrl("");
    setImageUrlPath("");
    setBarcodeError("");
    setBarcodeChecking(false);
    setBarcodeChanged(false);
    setDeletedProductId(null);
    setReactivatedProduct(null);
    setPendingReactivationId(null);
    setDialogMode(initial ? "edit" : "create");
  };

  const onPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
      setImageUploading(true);
      try {
        const res = await api.products.uploadImage(file) as { image_url: string };
        URL.revokeObjectURL(localUrl);
        const fullUrl = api.getImageUrl(res.image_url);
        setImageUrl(fullUrl ?? res.image_url);
        setImageUrlPath(res.image_url);
      } catch {
        URL.revokeObjectURL(localUrl);
        setImageUrl("");
        setImageUrlPath("");
        toast.error("Error al subir imagen");
      } finally {
        setImageUploading(false);
      }
    };
    input.click();
  };

  const onAi = () => {
    if (!barcode.trim()) {
      toast.error("Ingresa un código de barras primero");
      return;
    }
    lookupBarcodeInfo(barcode);
  };

  const doSubmit = async () => {
    const priceNum = Number(price);
    const costNum = Number(cost);
    const stockNum = parseInt(stock || "0", 10);
    const alertNum = parseInt(alert || "5", 10);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Precio inválido");
      return;
    }
    if (Number.isNaN(costNum) || costNum < 0) {
      toast.error("Costo inválido");
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      toast.error("Stock debe ser un entero positivo");
      return;
    }

    const trimmedBarcode = barcode.trim();
    const finalBarcode = trimmedBarcode || undefined;
    const isValidImageUrl = imageUrlPath && (
      imageUrlPath.startsWith("http") ||
      imageUrlPath.startsWith("/images/")
    );
    const data = {
      name: name.trim(),
      barcode: finalBarcode,
      category,
      price: priceNum,
      cost: costNum,
      stock: stockNum,
      lowStockAlert: alertNum,
      imageUrl: isValidImageUrl ? imageUrlPath : undefined,
    };

    setSubmitting(true);
    try {
      if (dialogMode === "reactivate") {
        const productIdToReactivate = pendingReactivationId ?? initial?.product_id ?? initial?.id;
        if (!productIdToReactivate) {
          toast.error("No se encontró el ID del producto a reactivar");
          setSubmitting(false);
          return;
        }
        await api.products.reactivate(productIdToReactivate, {
          business_id: BUSINESS_ID,
          store_id: STORE_ID,
          name: name.trim(),
          description: initial?.description ?? undefined,
          category: category,
          category_id: categoryId,
          price: priceNum,
          cost: costNum,
          low_stock_threshold: alertNum,
          stock_quantity: stockNum,
          image_url: isValidImageUrl ? imageUrlPath : undefined,
        });
        await initialize();
        toast.success("Producto reactivado");
        reset();
        onClose();
        return;
      }
      if (initial) {
        await updateProduct(initial.id, data);
        toast.success("Producto actualizado");
        reset();
        onClose();
        return;
      }
      await addProduct(data);
      toast.success("Producto agregado");
      reset();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (barcodeError || barcodeChecking || submitting || aiLoading) return;
    if (name.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }

    if (dialogMode === "reactivate") {
      await doSubmit();
      return;
    }

    const trimmedBarcode = barcode.trim();
    const productToSubmit = reactivatedProduct || initial;

    if (productToSubmit && barcodeChanged) {
      if (!confirm(`¿Cambiar el código de barras de "${productToSubmit.barcode}" a "${trimmedBarcode}"?`)) {
        return;
      }
    }

    if (!productToSubmit && !trimmedBarcode) {
      if (!confirm("¿Guardar producto sin código de barras?")) {
        return;
      }
    }

    await doSubmit();
  };

  const isDisabled = !!barcodeError || barcodeChecking || submitting || aiLoading;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              {dialogMode === "edit" ? "Editar producto" : dialogMode === "reactivate" ? "Reactivar producto" : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>

          {dialogMode === "reactivate" && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Producto desactivado. Al guardar, se reactivará este mismo registro con los datos actualizados.
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <button
                onClick={onPhoto}
                disabled={imageUploading}
                className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-primary-soft text-primary-soft-foreground transition-colors hover:bg-accent disabled:opacity-50"
                aria-label="Agregar imagen"
              >
                {imageUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-xs">
                    <ImagePlus className="h-6 w-6" />
                    Foto
                  </div>
                )}
              </button>

              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="name">Nombre del producto</Label>
                <Input
                  id="name"
                  placeholder="Ej. Coca-Cola 500ml"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="barcode">Código de barras</Label>
              <div className="mt-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={barcodeInputRef}
                    id="barcode"
                    placeholder="Ej. 7501055... (Enter para buscar)"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    onBlur={handleBarcodeBlur}
                    className={barcodeError ? "border-red-500 focus-visible:ring-red-500 pr-8" : "pr-8"}
                  />
                  {barcode && !barcodeChecking && !aiLoading && (
                    <button
                      type="button"
                      onClick={() => { setBarcode(""); setBarcodeError(""); setDeletedProductId(null); barcodeInputRef.current?.focus(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Limpiar código"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {(barcodeChecking || aiLoading) && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setScannerOpen(true)}
                  aria-label="Escanear"
                >
                  <ScanBarcode className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={onAi}
                  disabled={aiLoading || barcodeChecking || !barcode.trim()}
                  aria-label="Buscar información del producto"
                >
                  {aiLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {barcodeError && (
                <p className="mt-1 text-xs text-red-500">{barcodeError}</p>
              )}
            </div>

            <div>
              <Label>Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Precio (S/)</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cost">Costo (S/)</Label>
                <Input
                  id="cost"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock inicial</Label>
                <Input
                  id="stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="alert">Alerta stock</Label>
                <Input
                  id="alert"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={alert}
                  onChange={(e) => setAlert(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} className="shadow-soft" disabled={isDisabled}>
              {submitting || aiLoading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-1 h-4 w-4 opacity-0" />
              )}
              {aiLoading ? "Buscando..." : dialogMode === "reactivate" ? "Reactivar producto" : dialogMode === "edit" ? "Guardar cambios" : "Guardar producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          setBarcode(code);
          if (!initial && code.trim()) {
            setTimeout(() => lookupBarcodeInfo(code), 50);
          }
        }}
      />
    </>
  );
}
