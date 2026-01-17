import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import restApiRouter from "../api/rest";
import { authService } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Test database connection at startup
  console.log("[Server] Testing database connection...");
  const db = await getDb();
  if (db) {
    console.log("[Server] Database connected successfully!");
  } else {
    console.warn("[Server] WARNING: Database not connected! Some features may not work.");
    console.warn("[Server] Make sure DATABASE_URL environment variable is set correctly.");
  }

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check endpoint for Docker/Kubernetes
  app.get("/api/health", async (_req, res) => {
    const dbConnected = (await getDb()) !== null;
    res.json({ status: "ok", database: dbConnected ? "connected" : "disconnected", timestamp: Date.now() });
  });

  // Auth routes (login, register)
  registerAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // REST API v1 - com middleware para passar sessão do usuário (para criação de tokens)
  app.use("/api/v1", async (req, res, next) => {
    try {
      const user = await authService.authenticateRequest(req);
      (req as any).sessionUser = user;
    } catch {
      // Sessão não obrigatória - Bearer token será verificado pela API
      (req as any).sessionUser = null;
    }
    next();
  }, restApiRouter);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
