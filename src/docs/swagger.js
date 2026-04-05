import swaggerUi from "swagger-ui-express";
import SwaggerParser from "@apidevtools/swagger-parser";
import path from "path";
import { SUB_DOMAIN } from "../configs/serverConfig.js";
export default async function setupSwagger(app) {
  try {
    const rootPath = path.join(process.cwd(), "src/openapi/openapi.yaml");
    const swaggerDocument = await SwaggerParser.bundle(rootPath);
    swaggerDocument.servers = [
      { url: `http://${SUB_DOMAIN}.germany-assist.com/backend/api` },
      { url: "/api" },
    ];
    app.use(
      "/docs",
      (req, res, next) => {
        res.removeHeader("Content-Security-Policy");
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
        );
        next();
      },
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        customCssUrl: "swagger-ui.css",
        customJs: [
          "swagger-ui-bundle.js",
          "swagger-ui-standalone-preset.js",
          "/__swagger-dev/swagger-checkbox.js",
        ],
      }),
    );
    console.log("✅ Swagger documentation initialized");
  } catch (err) {
    console.error("❌ Swagger Load Error:", err);
  }
}
