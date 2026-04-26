import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, BUSINESS_ID, STORE_ID, type ReactivateProductPayload } from "./api";

export type ProductCategory =
  | "Bebidas"
  | "Snacks"
  | "Abarrotes"
  | "Limpieza"
  | "Cuidado Personal"
  | "Otros";

export interface Product {
  id: string;
  product_id?: number | string;
  name: string;
  description?: string | null;
  barcode?: string;
  categoryId?: number | null;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  lowStockAlert: number;
  imageUrl?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  date: string; // ISO
  items: SaleItem[];
  total: number;
  paymentMethod: "Efectivo" | "Tarjeta" | "Transferencia" | "Crédito";
  customerId?: string;
  status: "Completada" | "Pendiente" | "En curso";
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  credit: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  contact?: string;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  customerName: string;
  total: number;
  status: "Pagada" | "Pendiente";
}

interface StoreState {
  storeName: string;
  vendorName: string;
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;

  accessibilityScale: number;
  productDialog: { open: boolean; initial?: Product; barcode?: string };

  initialize: () => Promise<void>;
  setVendorName: (name: string) => void;
  setStoreName: (name: string) => void;
  setAccessibilityScale: (scale: number) => void;
  openProductDialog: (initial?: Product, barcode?: string) => void;
  closeProductDialog: () => void;

  addProduct: (p: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  reactivateProduct: (id: string, payload?: Partial<ReactivateProductPayload>) => Promise<Product>;
  findByBarcode: (code: string) => Product | undefined;

  addSale: (s: Omit<Sale, "id" | "date">) => Promise<Sale>;
  deleteSale: (id: string) => void;

  addCustomer: (c: Omit<Customer, "id">) => Customer;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (s: Omit<Supplier, "id">) => Supplier;
  deleteSupplier: (id: string) => void;

  addInvoice: (i: Omit<Invoice, "id">) => Invoice;
  deleteInvoice: (id: string) => void;
}

// Map backend category to frontend enum if needed, or just cast
const mapProduct = (p: any): Product => ({
  id: p.id.toString(),
  product_id: p.product_id ?? p.id,
  name: p.name,
  description: p.description,
  barcode: p.barcodes?.[0]?.barcode || p.barcode,
  categoryId: p.category_id,
  category: p.category_name || "Otros",
  price: p.price,
  cost: p.cost,
  stock: p.stock_quantity || 0,
  lowStockAlert: p.low_stock_threshold,
  imageUrl: p.image_url
});

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      storeName: "Mi Tienda",
      vendorName: "Vendedor",
      products: [],
      sales: [],
      customers: [],
      suppliers: [],
      invoices: [],
      isLoading: false,
      error: null,

      accessibilityScale: 1,
      productDialog: { open: false },

      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const [products, sales] = await Promise.all([
            api.products.list(),
            api.sales.getHistory(),
          ]);
          set({
            products: products.map(mapProduct),
            sales: sales.map((s: any) => ({
              id: s.id.toString(),
              date: s.created_at,
              items: s.items.map((i: any) => ({
                productId: i.product_id?.toString() || "",
                name: i.product_name_at_sale,
                price: i.price_at_sale,
                quantity: i.quantity,
              })),
              total: s.total_amount,
              paymentMethod: s.payments[0]?.payment_method === "cash" ? "Efectivo" : "Tarjeta",
              status: s.status === "completed" ? "Completada" : "Pendiente"
            })),
            isLoading: false
          });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      setVendorName: (name) => set({ vendorName: name }),
      setStoreName: (name) => set({ storeName: name }),
      setAccessibilityScale: (scale) => {
        document.documentElement.style.setProperty("--scale", String(scale));
        set({ accessibilityScale: scale });
      },
      openProductDialog: (initial, barcode) => set({ productDialog: { open: true, initial, barcode } }),
      closeProductDialog: () => set({ productDialog: { open: false } }),

      addProduct: async (p) => {
        const product = await api.products.create({
          ...p,
          business_id: BUSINESS_ID,
          low_stock_threshold: p.lowStockAlert,
          image_url: p.imageUrl
        });
        const mapped = mapProduct(product);
        set((s) => ({ products: [mapped, ...s.products] }));
        return mapped;
      },
      updateProduct: async (id, patch) => {
        const updated = await api.products.update(id, {
          ...patch,
          low_stock_threshold: patch.lowStockAlert,
          image_url: patch.imageUrl
        });
        const mapped = mapProduct(updated);
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? mapped : p)),
        }));
      },
      deleteProduct: async (id) => {
        await api.products.delete(id);
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
      },
      reactivateProduct: async (id, payload = {}) => {
        const reactivated = await api.products.reactivate(id, {
          business_id: BUSINESS_ID,
          store_id: STORE_ID,
          ...payload,
        });
        const mapped = mapProduct(reactivated);
        const existing = get().products.find((p) => p.id === mapped.id);
        if (existing) {
          set((s) => ({ products: s.products.map((p) => (p.id === mapped.id ? mapped : p)) }));
        } else {
          set((s) => ({ products: [mapped, ...s.products] }));
        }
        return mapped;
      },
      findByBarcode: (code) => get().products.find((p) => p.barcode === code),

      addSale: async (s) => {
        const saleData = {
          business_id: BUSINESS_ID,
          store_id: STORE_ID,
          items: s.items.map(item => ({
            product_id: parseInt(item.productId),
            product_name_at_sale: item.name,
            quantity: item.quantity,
            price_at_sale: item.price,
            cost_at_sale: get().products.find(p => p.id === item.productId)?.cost || 0,
          })),
          payments: [{
            payment_method: s.paymentMethod === "Efectivo" ? "cash" : "card",
            amount: s.total
          }]
        };
        const result = await api.sales.create(saleData);
        const newSale: Sale = {
          id: result.id.toString(),
          date: result.created_at,
          items: s.items,
          total: result.total_amount,
          paymentMethod: s.paymentMethod,
          status: "Completada"
        };
        set((state) => ({
          sales: [newSale, ...state.sales]
        }));
        await get().initialize(); // Sync with backend to get correct stock
        return newSale;
      },
      deleteSale: (id) => set((s) => ({ sales: s.sales.filter((x) => x.id !== id) })),

      addCustomer: (c) => {
        const customer = { ...c, id: Math.random().toString(36).slice(2, 10) };
        set((s) => ({ customers: [customer, ...s.customers] }));
        return customer;
      },
      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteCustomer: (id) =>
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      addSupplier: (s) => {
        const supplier = { ...s, id: Math.random().toString(36).slice(2, 10) };
        set((state) => ({ suppliers: [supplier, ...state.suppliers] }));
        return supplier;
      },
      deleteSupplier: (id) =>
        set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) })),

      addInvoice: (i) => {
        const invoice = { ...i, id: Math.random().toString(36).slice(2, 10) };
        set((s) => ({ invoices: [invoice, ...s.invoices] }));
        return invoice;
      },
      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),
    }),
    { name: "ventafacil-store" }
  )
);

export const formatPEN = (n: number) =>
  `S/ ${n.toFixed(2)}`;
