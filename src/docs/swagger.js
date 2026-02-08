export default async function setupSwagger(app) {
  try {
    const rootPath = path.join(process.cwd(), "src/openapi/openapi.yaml");
    const swaggerDocument = await SwaggerParser.bundle(rootPath);

    // Tell the "Try it out" button exactly where to go via http
    swaggerDocument.servers = [
      { url: "http://www.germany-assist.com/staging/backend" },
    ];

    app.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        // Using relative paths (no leading slash) or explicit staging paths
        customCssUrl: "/staging/backend/docs/swagger-ui.css",
        customJs: [
          "/staging/backend/docs/swagger-ui-bundle.js",
          "/staging/backend/docs/swagger-ui-standalone-preset.js",
        ],
      }),
    );
    console.log("✅ Swagger documentation initialized");
  } catch (err) {
    console.error("❌ Swagger Load Error:", err);
  }
}
