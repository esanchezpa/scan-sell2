import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useStore, formatPEN } from "@/lib/store";
import { ShoppingBag, TrendingUp, AlertTriangle, Star, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { NewSaleDialog } from "@/components/NewSaleDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio · VentaFácil" },
      { name: "description", content: "Resumen de ventas, inventario y métricas de tu tienda." },
    ],
  }),
  component: HomePage,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function HomePage() {
  const vendorName = useStore((s) => s.vendorName);
  const products = useStore((s) => s.products);
  const sales = useStore((s) => s.sales);
  const customers = useStore((s) => s.customers);
  const [openSale, setOpenSale] = useState(false);

  const monthSales = useMemo(() => {
    const now = new Date();
    return sales
      .filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const profit = useMemo(() => {
    return sales.reduce((sum, s) => {
      const itemProfit = s.items.reduce((sub, it) => {
        const p = products.find((x) => x.id === it.productId);
        const cost = p?.cost ?? 0;
        return sub + (it.price - cost) * it.quantity;
      }, 0);
      return sum + itemProfit;
    }, 0);
  }, [sales, products]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) =>
      s.items.forEach((i) => {
        const cur = map.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue += i.price * i.quantity;
        map.set(i.productId, cur);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) =>
      s.items.forEach((i) => {
        const p = products.find((x) => x.id === i.productId);
        const cat = p?.category ?? "Otros";
        map.set(cat, (map.get(cat) ?? 0) + i.price * i.quantity);
      })
    );
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sales, products]);

  const lowStock = products.filter((p) => p.stock <= p.lowStockAlert);
  const totalCredit = customers.reduce((sum, c) => sum + c.credit, 0);

  return (
    <AppShell>
      <header className="px-5 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-2xl shadow-glow">
            🛍️
          </div>
          <div>
            <p className="text-sm text-primary/80">Hola 👋</p>
            <h1 className="font-display text-xl font-bold tracking-tight">{vendorName}</h1>
          </div>
        </div>
      </header>

      {/* Hero metric: Sales of month */}
      <section className="mx-5 mb-3 overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Ventas del mes</p>
            <p className="mt-1 font-display text-3xl font-bold">{formatPEN(monthSales)}</p>
            <p className="mt-1 text-xs opacity-80">{sales.length} ventas registradas</p>
          </div>
          <TrendingUp className="h-10 w-10 opacity-70" />
        </div>
        <Button
          onClick={() => setOpenSale(true)}
          className="mt-4 h-11 w-full rounded-full bg-card/95 text-primary shadow-soft hover:bg-card"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Nueva venta
        </Button>
      </section>

      {/* KPI mini cards + Sales by category - 2 column layout */}
      <section className="mx-5 mb-3 grid grid-cols-2 gap-3">
        {/* Left column: stacked cards */}
        <div className="flex flex-col gap-3">
          <Card label="Rentabilidad" value={formatPEN(profit)} icon={<Star className="h-4 w-4" />} />
          <Card label="Por cobrar" value={formatPEN(totalCredit)} icon={<TrendingUp className="h-4 w-4" />} />
        </div>

        {/* Right column: Sales by category */}
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <h2 className="font-display text-base font-bold text-primary">Ventas por tipo</h2>
          <p className="text-xs text-muted-foreground">Por categoría</p>
          <div className="mt-2 h-36">
            {byCategory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Sin datos.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(v) => formatPEN(Number(v))}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {byCategory.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {byCategory.map((c, i) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top products */}
      <section className="mx-5 mb-3 rounded-3xl bg-card p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-primary">Productos estrella</h2>
        {topProducts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aún no hay ventas. ¡Registra la primera!
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-soft-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.qty} uds</span>
                <span className="font-display text-sm font-bold text-primary">
                  {formatPEN(p.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Low stock alerts */}
      <section className="mx-5 mb-3 rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary">Alertas de stock</h2>
          {lowStock.length > 0 && (
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-bold text-warning">
              {lowStock.length}
            </span>
          )}
        </div>
        {lowStock.length === 0 ? (
          <p className="mt-3 text-sm text-success">¡Todo en orden! Sin problemas de stock.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <Link
                key={p.id}
                to="/catalog"
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                  p.stock === 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/15 text-warning",
                ].join(" ")}
              >
                <AlertTriangle className="h-3 w-3" />
                {p.name} · {p.stock} uds
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FAB for new sale on mobile */}
      <button
        onClick={() => setOpenSale(true)}
        aria-label="Nueva venta"
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 sm:right-[calc(50%-18rem)]"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <NewSaleDialog open={openSale} onClose={() => setOpenSale(false)} />
    </AppShell>
  );
}

function Card({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-center justify-between text-primary/70">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-1 font-display text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
