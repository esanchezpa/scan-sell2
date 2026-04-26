import { useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";

interface UseGlobalBarcodeOptions {
  onProductFound: (product: any) => void;
  onProductNotFound: (barcode: string) => void;
  onError?: (err: Error) => void;
  enabled?: boolean;
}

export function useGlobalBarcodeListener({
  onProductFound,
  onProductNotFound,
  onError,
  enabled = true,
}: UseGlobalBarcodeOptions) {
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupBarcode = useCallback(async (barcode: string) => {
    try {
      const result = await api.barcode.lookup(barcode);
      if (result.source === "internal" && result.status === "inactive") {
        const productName = result.name || "este producto";
        if (confirm(`Este código pertenece a un producto eliminado: "${productName}". ¿Deseas reactivar y editar este producto?`)) {
          onProductNotFound(barcode);
        }
        return;
      }

      if (result.source === "internal" && result.status === "active") {
        const product = await api.products.getByBarcode(barcode) as any;
        onProductFound(product);
        return;
      }

      onProductNotFound(barcode);
    } catch {
      onProductNotFound(barcode);
    }
  }, [onProductFound, onProductNotFound]);

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
