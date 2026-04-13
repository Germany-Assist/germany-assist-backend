import express from "express";
import serviceController from "./service.controller.js";
import jwt from "../../middlewares/jwt.middleware.js";
import {
  idHashedBodyValidator,
  idHashedParamValidator,
} from "../../validators/general.validators.js";
import { validateExpress } from "../../middlewares/expressValidator.js";
import {
  createServiceValidator,
  pauseResumeServiceValidator,
} from "./services.validators.js";
import timelineRouter from "../timeline/timeline.routes.js";
import variantRouter from "../variant/variant.routes.js";
import multerUpload from "../../configs/multer.config.js";
import { variantsValidator } from "../variant/variant.validator.js";
import { timelinesValidator } from "../timeline/timeline.validator.js";

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
// get the provider his services no matter what the state
serviceRouter.get(
  "/provider/services",
  jwt.authenticateJwt,
  serviceController.getAllServicesSP,
);
// Get a specific service no matter the state
serviceRouter.get(
  "/provider/services/:id",
  jwt.authenticateJwt,
  idHashedParamValidator,
  validateExpress,
  serviceController.getServiceProfileForAdminAndSP,
);
//Mark as to do after finalization of onetimes and timelines
// Update a service (allowed fields only)
serviceRouter.put(
  "/provider/services/patch/:id",
  jwt.authenticateJwt,
  idHashedBodyValidator,
  validateExpress,
  serviceController.updateService,
);
// update the full service as long as its a draft
serviceRouter.put(
  "/provider/services/update/:id",
  multerUpload.array("images", 4),
  jwt.authenticateJwt,
  idHashedParamValidator,
  createServiceValidator,
  timelinesValidator,
  variantsValidator,
  validateExpress,
  serviceController.updateService,
);

// Pause or resume a service
serviceRouter.put(
  "/provider/services/:id/status",
  pauseResumeServiceValidator,
  validateExpress,
  jwt.authenticateJwt,
  serviceController.pauseResumeService,
);
// request approval on a service
serviceRouter.put(
  "/provider/services/:id/requestApproval",
  idHashedParamValidator,
  validateExpress,
  jwt.authenticateJwt,
  serviceController.requestApproval,
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
//approve and reject
serviceRouter.put(
  "/admin/services/status/:id",
  idHashedParamValidator,
  validateExpress,
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
