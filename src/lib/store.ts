import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProductCategory =
  | "Bebidas"
  | "Snacks"
  | "Abarrotes"
  | "Limpieza"
  | "Cuidado Personal"
  | "Otros";

export interface Product {
  id: string;
  name: string;
  barcode?: string;
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

  setVendorName: (name: string) => void;
  setStoreName: (name: string) => void;

  addProduct: (p: Omit<Product, "id">) => Product;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  findByBarcode: (code: string) => Product | undefined;

  addSale: (s: Omit<Sale, "id" | "date">) => Sale;
  deleteSale: (id: string) => void;

  addCustomer: (c: Omit<Customer, "id">) => Customer;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (s: Omit<Supplier, "id">) => Supplier;
  deleteSupplier: (id: string) => void;

  addInvoice: (i: Omit<Invoice, "id">) => Invoice;
  deleteInvoice: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const seedProducts: Product[] = [
  { id: "p1", name: "Coca-Cola 500ml", barcode: "7501055363057", category: "Bebidas", price: 3.5, cost: 2.2, stock: 24, lowStockAlert: 6 },
  { id: "p2", name: "Inca Kola 500ml", barcode: "7751271001234", category: "Bebidas", price: 3.5, cost: 2.1, stock: 4, lowStockAlert: 6 },
  { id: "p3", name: "Papas Lays Clásicas", barcode: "7702049001234", category: "Snacks", price: 2.5, cost: 1.4, stock: 12, lowStockAlert: 5 },
  { id: "p4", name: "Galletas Oreo", barcode: "7622300441234", category: "Snacks", price: 1.8, cost: 0.9, stock: 0, lowStockAlert: 4 },
  { id: "p5", name: "Arroz Costeño 1kg", barcode: "7751158001234", category: "Abarrotes", price: 5.9, cost: 4.2, stock: 18, lowStockAlert: 5 },
  { id: "p6", name: "Detergente Ariel 250g", barcode: "7501006501234", category: "Limpieza", price: 8.5, cost: 6.0, stock: 9, lowStockAlert: 3 },
  { id: "p7", name: "Shampoo Head & Shoulders", barcode: "7500435001234", category: "Cuidado Personal", price: 18.9, cost: 12.5, stock: 7, lowStockAlert: 3 },
  { id: "p8", name: "Pan Bimbo Integral", category: "Abarrotes", price: 6.5, cost: 4.5, stock: 2, lowStockAlert: 4 },
];

const seedCustomers: Customer[] = [
  { id: "c1", name: "María Quispe", phone: "987654321", credit: 0 },
  { id: "c2", name: "Carlos Mendoza", phone: "956123789", credit: 45.5 },
];

const seedSuppliers: Supplier[] = [
  { id: "s1", name: "Distribuidora Lima SAC", contact: "Juan Pérez", phone: "014567890" },
  { id: "s2", name: "Backus Distribución", contact: "Ana Torres", phone: "012345678" },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      storeName: "Mi Tienda",
      vendorName: "Vendedor",
      products: seedProducts,
      sales: [],
      customers: seedCustomers,
      suppliers: seedSuppliers,
      invoices: [],

      setVendorName: (name) => set({ vendorName: name }),
      setStoreName: (name) => set({ storeName: name }),

      addProduct: (p) => {
        const product = { ...p, id: uid() };
        set((s) => ({ products: [product, ...s.products] }));
        return product;
      },
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      findByBarcode: (code) => get().products.find((p) => p.barcode === code),

      addSale: (s) => {
        const sale: Sale = { ...s, id: uid(), date: new Date().toISOString() };
        set((state) => {
          const products = state.products.map((p) => {
            const item = s.items.find((i) => i.productId === p.id);
            return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
          });
          return { sales: [sale, ...state.sales], products };
        });
        return sale;
      },
      deleteSale: (id) => set((s) => ({ sales: s.sales.filter((x) => x.id !== id) })),

      addCustomer: (c) => {
        const customer = { ...c, id: uid() };
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
        const supplier = { ...s, id: uid() };
        set((state) => ({ suppliers: [supplier, ...state.suppliers] }));
        return supplier;
      },
      deleteSupplier: (id) =>
        set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) })),

      addInvoice: (i) => {
        const invoice = { ...i, id: uid() };
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
