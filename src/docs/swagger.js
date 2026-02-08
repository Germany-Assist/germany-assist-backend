import swaggerUi from "swagger-ui-express";
import SwaggerParser from "@apidevtools/swagger-parser";
import path from "path";

export default async function setupSwagger(app) {
  try {
    const rootPath = path.join(process.cwd(), "src/openapi/openapi.yaml");

    const swaggerDocument = await SwaggerParser.bundle(rootPath);

    app.use(
      "/staging/backend/docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        swaggerOptions: { serverUrl: "/staging/backend" },
      }),
    );
    console.log("✅ Swagger documentation initialized");
  } catch (err) {
    console.error("❌ Swagger Load Error:", err);
  }
}
