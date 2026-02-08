import { Router } from "express";
import timelineController from "./timeline.controller.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";
import { idHashedParamValidator } from "../../validators/general.validators.js";
import { validateExpress } from "../../middlewares/expressValidator.js";
const timelineRouter = Router();

timelineRouter.get(
  "/client/readTimeline/:id",
  jwtUtils.authenticateJwt,
  idHashedParamValidator,
  validateExpress,
  timelineController.getTimelineByIdForClient,
);

timelineRouter.put(
  "/provider/archiveTimeline/:id",
  jwtUtils.authenticateJwt,
  idHashedParamValidator,
  validateExpress,
  timelineController.archiveTimeline,
);

timelineRouter.post(
  "/provider/createNewTimeline",
  jwtUtils.authenticateJwt,
  timelineController.createNewTimeline,
);
export default timelineRouter;
