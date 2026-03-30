import express from "express";
import serviceController from "./service.controller.js";
import jwt from "../../middlewares/jwt.middleware.js";
import {
  idHashedBodyValidator,
  idHashedParamValidator,
} from "../../validators/general.validators.js";
import { validateExpress } from "../../middlewares/expressValidator.js";
import { createServiceValidator } from "./services.validators.js";
import timelineRouter from "../timeline/timeline.routes.js";
import variantRouter from "../variant/variant.routes.js";
import multerUpload from "../../configs/multer.config.js";

const serviceRouter = express.Router();

serviceRouter.use("/timeline", timelineRouter);
serviceRouter.use("/variant", variantRouter);

/* ---------------- Public Routes ---------------- */
// Get all services that are approved & published
serviceRouter.get("/", serviceController.getAllServices);
//service profile
serviceRouter.get(
  "/:id",
  idHashedParamValidator,
  validateExpress,
  serviceController.getServiceProfile,
);
/* ---------------- Provider Routes ---------------- */
// Create a new service
serviceRouter.post(
  "/provider",
  multerUpload.array("images", 4),
  jwt.authenticateJwt,
  createServiceValidator,
  validateExpress,
  serviceController.createService,
);

// Get all services of the authenticated provider (approved or not)
serviceRouter.get(
  "/provider/services",
  jwt.authenticateJwt,
  serviceController.getAllServicesSP,
);
serviceRouter.get(
  "/provider/services/:id",
  jwt.authenticateJwt,
  idHashedParamValidator,
  validateExpress,
  serviceController.getServiceProfileForAdminAndSP,
);
// Update a service (allowed fields only)
serviceRouter.put(
  "/provider/services",
  jwt.authenticateJwt,
  idHashedBodyValidator,
  validateExpress,
  serviceController.updateService,
);
// Delete a service (soft delete)
serviceRouter.delete(
  "/provider/services/:id",
  idHashedParamValidator,
  validateExpress,
  jwt.authenticateJwt,
  serviceController.deleteService,
);
serviceRouter.put(
  "/provider/services/status",
  jwt.authenticateJwt,
  serviceController.alterServiceStatusSP,
);
serviceRouter.get(
  "/provider/services/unpublish/:serviceId",
  jwt.authenticateJwt,
  serviceController.unpublishService,
);
serviceRouter.get(
  "/provider/services/publish/:serviceId",
  jwt.authenticateJwt,
  serviceController.publishService,
);
/* ---------------- Admin Routes ---------------- */
// Get all services (any status, any provider)
serviceRouter.get(
  "/admin/services",
  jwt.authenticateJwt,
  serviceController.getAllServicesAdmin,
);
serviceRouter.get(
  "/admin/services/:id",
  idHashedParamValidator,
  validateExpress,
  jwt.authenticateJwt,
  serviceController.getServiceProfileForAdminAndSP,
);
// Restore a deleted service
serviceRouter.post(
  "/admin/services/:id/restore",
  jwt.authenticateJwt,
  idHashedParamValidator,
  validateExpress,
  serviceController.restoreService,
);
serviceRouter.put(
  "/admin/services/status",
  jwt.authenticateJwt,
  serviceController.alterServiceStatus,
);

/*------------------- Client Routes ----------------*/
// add to favorite
serviceRouter.put(
  "/client/favorite/:id",
  idHashedParamValidator,
  validateExpress,
  jwt.authenticateJwt,
  serviceController.addToFavorite,
);
//remove from favorite
serviceRouter.delete(
  "/client/favorite/:id",
  idHashedParamValidator,
  validateExpress,
  jwt.authenticateJwt,
  serviceController.removeFromFavorite,
);
serviceRouter.get(
  "/client/services",
  jwt.authenticateJwt,
  serviceController.getClientServices,
);
export default serviceRouter;
