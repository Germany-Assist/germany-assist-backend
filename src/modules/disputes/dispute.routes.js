import express from "express";
import disputeController from "./dispute.controllers.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";
import { validateExpress } from "../../middlewares/expressValidator.js";
import {
  openDisputeValidator,
  providerResponseValidator,
  resolveDisputeValidator,
} from "./dispute.validation.js";

const router = express.Router();
// TODO Validation should be for creation as enum for the reason
router.post(
  "/create",
  openDisputeValidator,
  validateExpress,
  jwtUtils.authenticateJwt,
  disputeController.openDispute,
);

router.post(
  "/provider/response/:id",
  providerResponseValidator,
  validateExpress,
  jwtUtils.authenticateJwt,
  disputeController.providerResponse,
);

router.get("/", jwtUtils.authenticateJwt, disputeController.listDisputes);

router.patch(
  "/:id/in-review",
  jwtUtils.authenticateJwt,
  disputeController.markInReview,
);

router.patch(
  "/:id/resolve",
  resolveDisputeValidator,
  validateExpress,
  jwtUtils.authenticateJwt,
  disputeController.resolveDispute,
);
router.patch(
  "/:id/cancel",
  jwtUtils.authenticateJwt,
  disputeController.cancelDispute,
);
export default router;
