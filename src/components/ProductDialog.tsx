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
import {
  useStore,
  type Product,
  type ProductCategory,
  type ProductDialogMode,
  type ProductDialogSource,
} from "@/lib/store";
import { api } from "@/lib/api";
import {
  Loader2,
  ImagePlus,
  PackagePlus,
  RefreshCcw,
  Save,
  ScanBarcode,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
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
  mode?: ProductDialogMode;
  source?: ProductDialogSource;
}

type ProductFormSnapshot = {
  name: string;
  barcode: string;
  category: ProductCategory;
  categoryId: number | null;
  price: string;
  cost: string;
  stock: string;
  alert: string;
  imageUrl: string;
  imageUrlPath: string;
  barcodeError: string;
  barcodeChecking: boolean;
  barcodeChanged: boolean;
  deletedProductId: number | null;
  reactivatedProduct: Product | null;
  pendingReactivationId: number | null;
  dialogMode: "create" | "edit" | "reactivate";
};

export function ProductDialog({
  open,
  onClose,
  initial,
  barcode: barcodeProp,
  mode,
  source = "catalog",
}: ProductDialogProps) {
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const reactivateProduct = useStore((s) => s.reactivateProduct);
  const queueProductForSale = useStore((s) => s.queueProductForSale);

  const [name, setName] = useState(initial?.name ?? "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [category, setCategory] = useState<ProductCategory>(initial?.category ?? "Otros");
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [cost, setCost] = useState(String(initial?.cost ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? ""));
  const [alert, setAlert] = useState(
    String(initial?.lowStockAlert ?? initial?.lowStockThreshold ?? "5"),
  );
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
  const hidBufferRef = useRef("");
  const hidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hidStartedBarcodeRef = useRef("");
  const hidStartedFormRef = useRef<ProductFormSnapshot | null>(null);
  const initialBarcodeRef = useRef(initial?.barcode);
  const barcodeValueRef = useRef(barcode);
  const formSnapshotRef = useRef<ProductFormSnapshot | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeValueRef.current = barcode;
  }, [barcode]);

  useEffect(() => {
    formSnapshotRef.current = {
      name,
      barcode,
      category,
      categoryId,
      price,
      cost,
      stock,
      alert,
      imageUrl,
      imageUrlPath,
      barcodeError,
      barcodeChecking,
      barcodeChanged,
      deletedProductId,
      reactivatedProduct,
      pendingReactivationId,
      dialogMode,
    };
  }, [
    alert,
    barcode,
    barcodeChanged,
    barcodeChecking,
    barcodeError,
    category,
    categoryId,
    cost,
    deletedProductId,
    dialogMode,
    imageUrl,
    imageUrlPath,
    name,
    pendingReactivationId,
    price,
    reactivatedProduct,
    stock,
  ]);

  const restoreFormSnapshot = (snapshot: ProductFormSnapshot | null | undefined) => {
    if (!snapshot) return;
    setName(snapshot.name);
    setBarcode(snapshot.barcode);
    barcodeValueRef.current = snapshot.barcode;
    setCategory(snapshot.category);
    setCategoryId(snapshot.categoryId);
    setPrice(snapshot.price);
    setCost(snapshot.cost);
    setStock(snapshot.stock);
    setAlert(snapshot.alert);
    setImageUrl(snapshot.imageUrl);
    setImageUrlPath(snapshot.imageUrlPath);
    setBarcodeError(snapshot.barcodeError);
    setBarcodeChecking(snapshot.barcodeChecking);
    setBarcodeChanged(snapshot.barcodeChanged);
    setDeletedProductId(snapshot.deletedProductId);
    setReactivatedProduct(snapshot.reactivatedProduct);
    setPendingReactivationId(snapshot.pendingReactivationId);
    setDialogMode(snapshot.dialogMode);
  };

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
      if (hidTimerRef.current) clearTimeout(hidTimerRef.current);
      hidBufferRef.current = "";
      hidStartedBarcodeRef.current = "";
      hidStartedFormRef.current = null;
    } else {
      const nextMode = mode ?? (initial ? "edit" : "create");
      const nextImageUrl = initial?.imageUrl ?? initial?.image_url ?? "";
      setName(initial?.name ?? "");
      setBarcode(initial?.barcode ?? barcodeProp ?? "");
      setCategory(initial?.category ?? "Otros");
      setCategoryId(initial?.categoryId ?? null);
      setPrice(String(initial?.price ?? ""));
      setCost(String(initial?.cost ?? ""));
      setStock(String(initial?.stock ?? ""));
      setAlert(String(initial?.lowStockAlert ?? initial?.lowStockThreshold ?? "5"));
      const fullUrl = api.getImageUrl(nextImageUrl) ?? nextImageUrl;
      setImageUrl(fullUrl);
      setImageUrlPath(nextImageUrl);
      initialBarcodeRef.current = initial?.barcode ?? barcodeProp ?? "";
      setBarcodeChanged(false);
      setDeletedProductId(null);
      setReactivatedProduct(null);
      setPendingReactivationId(
        nextMode === "reactivate" ? Number(initial?.product_id ?? initial?.id) || null : null,
      );
      setDialogMode(nextMode);
      setBarcodeError("");
      setBarcodeChecking(false);
      setBarcodeChanged(false);
      setAiLoading(false);
      setImageUploading(false);
      setSubmitting(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (offLookupRef.current) clearTimeout(offLookupRef.current);
      if (hidTimerRef.current) clearTimeout(hidTimerRef.current);
      hidBufferRef.current = "";
      hidStartedBarcodeRef.current = "";
      hidStartedFormRef.current = null;

      if (nextMode === "create" && !initial && barcodeProp && barcodeProp.trim()) {
        if (offLookupRef.current) clearTimeout(offLookupRef.current);
        offLookupRef.current = setTimeout(() => lookupBarcodeInfo(barcodeProp), 100);
      }
    }
  }, [open, initial, barcodeProp, mode]);

  const startNewRegistrationFromBarcode = (code: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (offLookupRef.current) clearTimeout(offLookupRef.current);

    setName("");
    setBarcode(code);
    barcodeValueRef.current = code;
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
    setDialogMode("create");
    initialBarcodeRef.current = code;

    offLookupRef.current = setTimeout(() => lookupBarcodeInfo(code), 50);
    barcodeInputRef.current?.focus();
  };

  const handlePhysicalBarcodeScan = (
    code: string,
    startedBarcode: string,
    startedForm?: ProductFormSnapshot | null,
  ) => {
    if (initial || dialogMode !== "create" || submitting || aiLoading) return;

    const currentBarcode = startedBarcode.trim() || barcodeValueRef.current.trim();
    if (currentBarcode && currentBarcode === code) {
      restoreFormSnapshot(startedForm);
      setBarcode(code);
      barcodeValueRef.current = code;
      lookupBarcodeInfo(code);
      barcodeInputRef.current?.focus();
      return;
    }

    if (currentBarcode && currentBarcode !== code) {
      if (!confirm("Desea cancelar este registro y registrar uno nuevo?")) {
        restoreFormSnapshot(startedForm);
        barcodeInputRef.current?.focus();
        return;
      }
    }

    startNewRegistrationFromBarcode(code);
  };

  useEffect(() => {
    if (!open || scannerOpen || initial || dialogMode !== "create") return;

    const resetHidBuffer = () => {
      hidBufferRef.current = "";
      hidStartedBarcodeRef.current = "";
      hidStartedFormRef.current = null;
      if (hidTimerRef.current) {
        clearTimeout(hidTimerRef.current);
        hidTimerRef.current = null;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (/^\d$/.test(e.key)) {
        if (!hidBufferRef.current) {
          hidStartedBarcodeRef.current = barcodeValueRef.current.trim();
          hidStartedFormRef.current = formSnapshotRef.current;
        }
        hidBufferRef.current += e.key;
        if (hidTimerRef.current) clearTimeout(hidTimerRef.current);
        hidTimerRef.current = setTimeout(resetHidBuffer, 120);
        return;
      }

      if (e.key === "Enter" && hidBufferRef.current.length >= 8) {
        const code = hidBufferRef.current.trim();
        const startedBarcode = hidStartedBarcodeRef.current;
        const startedForm = hidStartedFormRef.current;
        resetHidBuffer();

        if (/^\d{8,14}$/.test(code)) {
          e.preventDefault();
          e.stopPropagation();
          handlePhysicalBarcodeScan(code, startedBarcode, startedForm);
        }
        return;
      }

      if (e.key !== "Tab") {
        resetHidBuffer();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      resetHidBuffer();
    };
  }, [aiLoading, dialogMode, initial, open, scannerOpen, submitting]);

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
            const matched = categories.find(
              (c) => c.toLowerCase() === result.category_name!.toLowerCase(),
            );
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
        const matched = categories.find(
          (c) => c.toLowerCase() === result.category_name!.toLowerCase(),
        );
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
        const res = (await api.products.uploadImage(file)) as { image_url: string };
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

  const notifyProductSavedForSale = (product: Product) => {
    queueProductForSale(product);
  };

  const doSubmit = async (addToSale = false) => {
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
    const isValidImageUrl =
      imageUrlPath && (imageUrlPath.startsWith("http") || imageUrlPath.startsWith("/images/"));
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
        const product = await reactivateProduct(productIdToReactivate.toString(), {
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
        if (addToSale) {
          notifyProductSavedForSale(product);
        }
        toast.success(addToSale ? "Producto reactivado y agregado" : "Producto reactivado");
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
      const product = await addProduct(data);
      if (addToSale) {
        notifyProductSavedForSale(product);
      }
      toast.success(addToSale ? "Producto guardado y agregado" : "Producto agregado");
      reset();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (addToSale = false) => {
    if (barcodeError || barcodeChecking || submitting || aiLoading) return;
    if (name.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }

    if (dialogMode === "reactivate") {
      await doSubmit(addToSale);
      return;
    }

    const trimmedBarcode = barcode.trim();
    const productToSubmit = reactivatedProduct || initial;

    if (productToSubmit && barcodeChanged) {
      if (
        !confirm(
          `¿Cambiar el código de barras de "${productToSubmit.barcode}" a "${trimmedBarcode}"?`,
        )
      ) {
        return;
      }
    }

    if (!productToSubmit && !trimmedBarcode) {
      if (!confirm("¿Guardar producto sin código de barras?")) {
        return;
      }
    }

    await doSubmit(addToSale);
  };

  const isDisabled = !!barcodeError || barcodeChecking || submitting || aiLoading;
  const showSaveAndAdd = source === "sale" && dialogMode !== "edit";

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="!flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1.5rem)] max-w-lg !flex-col overflow-hidden !gap-0 !p-0 sm:w-full sm:max-h-[90dvh]">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-display text-xl text-primary">
              {dialogMode === "edit"
                ? "Editar producto"
                : dialogMode === "reactivate"
                  ? "Reactivar producto"
                  : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
            {dialogMode === "reactivate" && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Producto desactivado. Al guardar, se reactivará este mismo registro.
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
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
                      className={
                        barcodeError ? "border-red-500 focus-visible:ring-red-500 pr-8" : "pr-8"
                      }
                    />
                    {barcode && !barcodeChecking && !aiLoading && (
                      <button
                        type="button"
                        onClick={() => {
                          setBarcode("");
                          setBarcodeError("");
                          setDeletedProductId(null);
                          barcodeInputRef.current?.focus();
                        }}
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
                {barcodeError && <p className="mt-1 text-xs text-red-500">{barcodeError}</p>}
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
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-background px-6 py-4">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              {showSaveAndAdd && (
                <Button
                  onClick={() => submit(true)}
                  className="w-full bg-success text-success-foreground shadow-soft hover:bg-success/90 sm:w-auto"
                  disabled={isDisabled}
                >
                  {submitting || aiLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  )}
                  {dialogMode === "reactivate" ? "Reactivar y agregar" : "Guardar y agregar"}
                </Button>
              )}
              <Button
                onClick={() => submit(false)}
                className="w-full shadow-soft sm:w-auto"
                disabled={isDisabled}
              >
                {submitting || aiLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <span className="mr-2 flex h-4 w-4 items-center justify-center">
                    {dialogMode === "reactivate" ? (
                      <RefreshCcw className="h-4 w-4" />
                    ) : dialogMode === "edit" ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <PackagePlus className="h-4 w-4" />
                    )}
                  </span>
                )}
                {aiLoading
                  ? "Buscando..."
                  : dialogMode === "reactivate"
                    ? "Reactivar producto"
                    : dialogMode === "edit"
                      ? "Guardar cambios"
                      : "Guardar producto"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          const trimmed = code.trim();
          if (!trimmed) return;
          handlePhysicalBarcodeScan(trimmed, barcodeValueRef.current.trim());
        }}
      />
    </>
  );
}
