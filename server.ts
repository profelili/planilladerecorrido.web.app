/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Endpoint to download the standalone single HTML file
  app.get("/api/download-singlefile", (req, res) => {
    console.log("Iniciando proceso de descarga...");
    const distIndex = path.resolve(process.cwd(), "dist", "index.html");
    const rootIndex = path.resolve(process.cwd(), "index_standalone.html");
    
    // Always trigger a fresh build to ensure the latest changes are captured
    console.log("Generando archivo único (standalone)...");
    exec("npx vite build", (error, stdout, stderr) => {
      if (error) {
        console.error("Error al compilar:", error);
        res.status(500).send(`Error compilando el archivo: ${error.message}\n${stderr}`);
        return;
      }
      
      if (fs.existsSync(distIndex)) {
        console.log("Archivo dist/index.html compilado exitosamente.");
        
        try {
          // Copiar el archivo al directorio raíz para que esté accesible en el explorador de archivos
          fs.copyFileSync(distIndex, rootIndex);
          console.log("Archivo index_standalone.html guardado en la raíz del proyecto.");
        } catch (copyErr) {
          console.error("Error al copiar a la raíz:", copyErr);
        }
        
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.download(distIndex, "index.html");
      } else {
        res.status(500).send("No se pudo hallar el archivo compilado dist/index.html tras compilar.");
      }
    });
  });

  // Endpoint to view the standalone single HTML file inline in the browser
  app.get("/api/view-singlefile", (req, res) => {
    const distIndex = path.resolve(process.cwd(), "dist", "index.html");
    const rootIndex = path.resolve(process.cwd(), "index_standalone.html");
    
    const serveFile = () => {
      if (fs.existsSync(distIndex)) {
        try {
          fs.copyFileSync(distIndex, rootIndex);
        } catch (e) {}
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.sendFile(distIndex);
      } else {
        res.status(500).send("Error: El archivo index.html compilado no existe.");
      }
    };

    console.log("Compilando para visualización interactiva...");
    exec("npx vite build", (error) => {
      if (error) {
        res.status(500).send(`Error compilando el archivo: ${error.message}`);
        return;
      }
      serveFile();
    });
  });

  // Handle Vite middleware for dev or Static Files for Prod
  if (process.env.NODE_ENV !== "production") {
    const viteModule = await (new Function('return import("vite")')()) as any;
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
