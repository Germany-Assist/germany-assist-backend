import express from "express";
import disputeController from "./dispute.controllers.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";

const router = express.Router();
router.post("/", jwtUtils.authenticateJwt, disputeController.openDispute);

//example filters
//?status=1&orderId=1&userId=hashedId&status=1&resolution=1
router.get(
  "/provider",
  jwtUtils.authenticateJwt,
  disputeController.listDisputesProvider,
);

//example filters
//?status=1&orderId=1&userId=hashedId&status=1&resolution=1&serviceProviderId=id
router.get(
  "/client",
  jwtUtils.authenticateJwt,
  disputeController.listDisputesClient,
);

//example filters
//?status=1&orderId=1&userId=hashedId&status=1&resolution=1&serviceProviderId=id
router.get(
  "/admin",
  jwtUtils.authenticateJwt,
  disputeController.listDisputesAdmin,
);

router.get("/:id", disputeController.getDispute);

router.patch("/:id/review", disputeController.markInReview);

router.patch("/:id/resolve", disputeController.resolveDispute);

export default router;
