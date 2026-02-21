import { Router } from "express";
import metaController from "./notification.controllers.js";
const metaRouter = Router();

metaRouter.get("/", metaController.initCall);
export default metaRouter;
