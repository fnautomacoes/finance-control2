import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  // Only import vite-related packages in development mode
  // These are devDependencies and won't exist in production
  if (process.env.NODE_ENV !== "development") {
    console.warn("[Vite] setupVite called in non-development mode, skipping...");
    return;
  }

  try {
    // Use Function constructor to create truly dynamic imports that esbuild won't analyze
    const dynamicImport = new Function("specifier", "return import(specifier)");

    const { createServer: createViteServer } = await dynamicImport("vite");
    const { nanoid } = await dynamicImport("nanoid");
    const react = (await dynamicImport("@vitejs/plugin-react")).default;
    const tailwindcss = (await dynamicImport("@tailwindcss/vite")).default;
    const { jsxLocPlugin } = await dynamicImport("@builder.io/vite-plugin-jsx-loc");

    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    };

    // Inline vite config to avoid importing vite.config.ts which has devDependencies
    const vite = await createViteServer({
      plugins: [react(), tailwindcss(), jsxLocPlugin()],
      resolve: {
        alias: {
          "@": path.resolve(import.meta.dirname, "../..", "client", "src"),
          "@shared": path.resolve(import.meta.dirname, "../..", "shared"),
          "@assets": path.resolve(import.meta.dirname, "../..", "attached_assets"),
        },
      },
      envDir: path.resolve(import.meta.dirname, "../.."),
      root: path.resolve(import.meta.dirname, "../..", "client"),
      publicDir: path.resolve(import.meta.dirname, "../..", "client", "public"),
      build: {
        outDir: path.resolve(import.meta.dirname, "../..", "dist/public"),
        emptyOutDir: true,
      },
      server: serverOptions,
      appType: "custom",
      configFile: false,
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "../..",
          "client",
          "index.html"
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("[Vite] Failed to setup Vite dev server:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
