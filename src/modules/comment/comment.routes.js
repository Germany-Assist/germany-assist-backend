import { Router } from "express";
import commentController from "./comment.controller.js";
import jwtUtils from "../../middlewares/jwt.middleware.js";
import { validateExpress } from "../../middlewares/expressValidator.js";
import { commentValidator } from "./comment.validator.js";

const commentRouter = Router();

commentRouter.post(
  "/",
  jwtUtils.authenticateJwt,
  commentValidator,
  validateExpress,
  commentController.createNewComment,
);
commentRouter.get(
  "/getPostComments/:postId",
  jwtUtils.authenticateJwt,
  commentController.getPostComments,
);
export default commentRouter;
