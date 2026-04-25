import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1f8fff" },
      { title: "VentaFácil — POS para tu tienda" },
      { name: "description", content: "Gestiona ventas, inventario y catálogo desde tu navegador. Punto de venta moderno con escáner de código de barras." },
      { name: "author", content: "VentaFácil" },
      { property: "og:title", content: "VentaFácil — POS para tu tienda" },
      { property: "og:description", content: "Gestiona ventas, inventario y catálogo desde tu navegador. Punto de venta moderno con escáner de código de barras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "VentaFácil — POS para tu tienda" },
      { name: "twitter:description", content: "Gestiona ventas, inventario y catálogo desde tu navegador. Punto de venta moderno con escáner de código de barras." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b8c403ca-3395-4871-85a1-bb5cdcd2e7cc/id-preview-2f2b0bad--03c9c99d-fa6e-4387-b4f0-31f48cbbcc26.lovable.app-1777049944749.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b8c403ca-3395-4871-85a1-bb5cdcd2e7cc/id-preview-2f2b0bad--03c9c99d-fa6e-4387-b4f0-31f48cbbcc26.lovable.app-1777049944749.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=PT+Sans:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="bottom-center" richColors />
    </>
  );
}
