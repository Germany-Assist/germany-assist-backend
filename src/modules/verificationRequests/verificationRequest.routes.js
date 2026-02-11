import express from "express";
import jwtUtils from "../../middlewares/jwt.middleware.js";
import verificationRequestController from "./verificationRequest.controller.js";
import multerUpload from "../../configs/multer.config.js";
const router = express.Router();
//TODO validation
// -------------------- Service Provider --------------------
router.post(
  "/provider",
  multerUpload.fields([
    { name: "verificationImage", maxCount: 1 },
    { name: "verificationDocument", maxCount: 1 },
  ]),
  jwtUtils.authenticateJwt,
  verificationRequestController.createProvider,
);
router.put(
  "/provider",
  multerUpload.fields([
    { name: "verificationImage", maxCount: 1 },
    { name: "verificationDocument", maxCount: 1 },
  ]),
  jwtUtils.authenticateJwt,
  verificationRequestController.updateProvider,
);
router.get(
  "/provider/profile",
  jwtUtils.authenticateJwt,
  verificationRequestController.getAllProvider,
); // List profiles status requests

// -------------------- Admin --------------------
router.get(
  "/admin",
  jwtUtils.authenticateJwt,
  verificationRequestController.getAllAdmin,
); // List all requests
router.put(
  "/admin/:id",
  jwtUtils.authenticateJwt,
  verificationRequestController.updateAdmin,
); // Approve/reject

export default router;
