import { useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { mapBarcodeLookupToProduct, type Product, useStore } from "@/lib/store";

interface UseGlobalBarcodeOptions {
  onProductFound: (product: any) => void;
  onProductNotFound: (barcode: string, productForReactivate?: Product) => void;
  onError?: (err: Error) => void;
  enabled?: boolean;
}

export function useGlobalBarcodeListener({
  onProductFound,
  onProductNotFound,
  onError,
  enabled = true,
}: UseGlobalBarcodeOptions) {
  const findByBarcode = useStore((s) => s.findByBarcode);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toProductPayload = useCallback((product: Product | any, fallbackBarcode?: string) => {
    if (product?.stock_quantity !== undefined || product?.category_name !== undefined || product?.barcodes) {
      return product;
    }

    const id = Number(product?.product_id ?? product?.id ?? 0);
    const barcode = product?.barcode ?? fallbackBarcode ?? "";

    return {
      id,
      product_id: id,
      name: product?.name ?? "",
      description: product?.description ?? null,
      barcode,
      category_id: product?.categoryId ?? null,
      category_name: product?.category ?? "Otros",
      price: product?.price ?? 0,
      cost: product?.cost ?? 0,
      stock_quantity: product?.stock ?? 0,
      low_stock_threshold: product?.lowStockThreshold ?? product?.lowStockAlert ?? 5,
      image_url: product?.image_url ?? product?.imageUrl ?? null,
      barcodes: barcode
        ? [
            {
              barcode,
              is_primary: true,
            },
          ]
        : [],
    };
  }, []);

  const lookupBarcode = useCallback(async (barcode: string) => {
    const cached = findByBarcode(barcode);
    if (cached) {
      onProductFound(toProductPayload(cached, barcode));
      return;
    }

    try {
      const result = await api.barcode.lookup(barcode);
      if (result.source === "internal" && result.status === "inactive") {
        const productName = result.name || "este producto";
        if (confirm(`Este código pertenece a un producto eliminado: "${productName}". ¿Deseas reactivarlo?`)) {
          onProductNotFound(barcode, mapBarcodeLookupToProduct(result, barcode));
        }
        return;
      }

      if (result.source === "internal" && result.status === "active") {
        onProductFound(toProductPayload(mapBarcodeLookupToProduct(result, barcode), barcode));
        return;
      }

      onProductNotFound(barcode);
    } catch (err) {
      onError?.(err as Error);
      onProductNotFound(barcode);
    }
  }, [findByBarcode, onError, onProductFound, onProductNotFound, toProductPayload]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputLike = target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputLike) return;

      const key = e.key;
      if (key === "Enter" && bufferRef.current.length >= 8) {
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        if (timerRef.current) clearTimeout(timerRef.current);
        if (/^\d{8,14}$/.test(code)) {
          e.preventDefault();
          lookupBarcode(code);
        }
        return;
      }

      if (!/^\d$/.test(key)) {
        bufferRef.current = "";
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      bufferRef.current += key;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = "";
      }, 100);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, lookupBarcode]);
}
