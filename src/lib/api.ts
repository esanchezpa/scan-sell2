const normalizeBaseUrl = (value: unknown, fallback: string) => {
  const raw = typeof value === "string" ? value.trim() : "";
  return (raw || fallback).replace(/\/+$/, "");
};

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL, "/api/v1");
const IMAGE_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_IMAGE_BASE_URL, "");
export const BUSINESS_ID = Number(import.meta.env.VITE_BUSINESS_ID ?? 6);
export const STORE_ID = Number(import.meta.env.VITE_STORE_ID ?? 6);

export interface BarcodeLookupResponse {
  found: boolean;
  source: "internal" | "cache" | "openfoodfacts" | "none" | null;
  status: "active" | "inactive" | "external_suggestion" | "not_found" | null;
  barcode: string;
  product_id: number | null;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  price: number | null;
  cost: number | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  description: string | null;
}

export interface ReactivateProductPayload {
  business_id: number;
  store_id: number;
  name?: string;
  description?: string | null;
  category?: string;
  category_id?: number | null;
  price?: number;
  cost?: number;
  image_url?: string;
  low_stock_threshold?: number;
  stock_quantity?: number;
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = response.statusText || "Unknown error";
  const text = await response.text().catch(() => "");
  if (!text) return fallback;

  try {
    const error = JSON.parse(text);
    if (typeof error.detail === "string") return error.detail;
    if (Array.isArray(error.detail)) return error.detail.map((item) => item.msg ?? item).join(", ");
    if (typeof error.message === "string") return error.message;
    return JSON.stringify(error);
  } catch {
    return text;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export const api = {
  getImageUrl: (path: string) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${IMAGE_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  },
  products: {
    list: () => request<any[]>(`/products/?business_id=${BUSINESS_ID}`),
    get: (id: string) => request<any>(`/products/${id}`),
    getByBarcode: (barcode: string) => request<any>(`/products/barcode/${encodeURIComponent(barcode)}?business_id=${BUSINESS_ID}`),
    barcodeExists: (barcode: string) => request<{exists: boolean; is_deleted: boolean; product_id: number | null}>(`/products/barcode-exists/${encodeURIComponent(barcode)}?business_id=${BUSINESS_ID}`),
    create: (data: any) => request<any>("/products/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/products/${id}`, { method: "DELETE" }),
    reactivate: (id: string | number, data: ReactivateProductPayload) =>
      request<any>(`/products/${id}/reactivate`, { method: "PATCH", body: JSON.stringify(data) }),
    uploadImage: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/products/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      return response.json();
    },
  },
  inventory: {
    getStatus: () => request<any[]>("/inventory/status"),
    getHistory: (productId: string) => request<any[]>(`/inventory/history/${productId}`),
    addMovement: (data: any) => request<any>("/inventory/movement", { method: "POST", body: JSON.stringify(data) }),
  },
  sales: {
    create: (data: any) => request<any>("/sales/", { method: "POST", body: JSON.stringify(data) }),
    getHistory: () => request<any[]>(`/sales/history?business_id=${BUSINESS_ID}`),
  },
  reports: {
    getDashboard: () => request<any>("/reports/dashboard"),
  },
  barcode: {
    lookup: (barcode: string) =>
      request<BarcodeLookupResponse>(`/barcode/lookup/${encodeURIComponent(barcode)}?business_id=${BUSINESS_ID}&store_id=${STORE_ID}`),
  }
};
