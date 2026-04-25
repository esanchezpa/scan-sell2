import { useState } from "react";
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
import { Camera, ScanBarcode, Sparkles, Loader2, ImagePlus } from "lucide-react";
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
}

export function ProductDialog({ open, onClose, initial }: ProductDialogProps) {
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const findByBarcode = useStore((s) => s.findByBarcode);

  const [name, setName] = useState(initial?.name ?? "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [category, setCategory] = useState<ProductCategory>(initial?.category ?? "Otros");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [cost, setCost] = useState(String(initial?.cost ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? ""));
  const [alert, setAlert] = useState(String(initial?.lowStockAlert ?? "5"));
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const reset = () => {
    setName("");
    setBarcode("");
    setCategory("Otros");
    setPrice("");
    setCost("");
    setStock("");
    setAlert("5");
    setImageUrl("");
  };

  const onAi = async () => {
    if (!barcode) {
      toast.error("Ingresa un código de barras primero");
      return;
    }
    setAiLoading(true);
    // simulated AI autocomplete
    await new Promise((r) => setTimeout(r, 900));
    if (!name) setName(`Producto ${barcode.slice(-4)}`);
    if (!category) setCategory("Otros");
    setAiLoading(false);
    toast.success("Datos sugeridos por IA");
  };

  const onPhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const submit = () => {
    if (name.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }
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

    const data = {
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      category,
      price: priceNum,
      cost: costNum,
      stock: stockNum,
      lowStockAlert: alertNum,
      imageUrl: imageUrl || undefined,
    };

    if (initial) {
      updateProduct(initial.id, data);
      toast.success("Producto actualizado");
    } else {
      if (data.barcode && findByBarcode(data.barcode)) {
        toast.error("Ya existe un producto con ese código");
        return;
      }
      addProduct(data);
      toast.success("Producto agregado");
    }
    reset();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">
              {initial ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <button
                onClick={onPhoto}
                className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-primary-soft text-primary-soft-foreground transition-colors hover:bg-accent"
                aria-label="Agregar imagen"
              >
                {imageUrl ? (
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
                <Input
                  id="barcode"
                  placeholder="Ej. 7501055..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
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
                  disabled={aiLoading}
                  aria-label="Autocompletar con IA"
                >
                  {aiLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </Button>
              </div>
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
            <Button onClick={submit} className="shadow-soft">
              <Camera className="mr-1 h-4 w-4 opacity-0" />
              {initial ? "Guardar cambios" : "Guardar producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => setBarcode(code)}
      />
    </>
  );
}
