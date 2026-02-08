import swaggerUi from "swagger-ui-express";
import SwaggerParser from "@apidevtools/swagger-parser";
import path from "path";
export default async function setupSwagger(app) {
  try {
    const rootPath = path.join(process.cwd(), "src/openapi/openapi.yaml");
    const swaggerDocument = await SwaggerParser.bundle(rootPath);

    // Tell the "Try it out" button exactly where to go via http
    swaggerDocument.servers = [
      { url: "http://www.germany-assist.com/staging/backend/api" },
    ];

    app.use(
      "/docs",
      (req, res, next) => {
        // This tells the browser: "Do NOT upgrade to HTTPS, and stay on HTTP"
        res.removeHeader("Content-Security-Policy");
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
        );
        next();
      },
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        // We use relative paths to avoid the domain name entirely
        customCssUrl: "swagger-ui.css",
        customJs: ["swagger-ui-bundle.js", "swagger-ui-standalone-preset.js"],
      }),
    );
    console.log("✅ Swagger documentation initialized");
  } catch (err) {
    console.error("❌ Swagger Load Error:", err);
  }
}
