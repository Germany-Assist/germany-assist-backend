import { Router } from "express";
import jwt from "../../middlewares/jwt.middleware.js";
import * as dashboardController from "./dashboard.controller.js";

const dashboardRouter = Router();

// All routes require authentication
// dashboardRouter.use(jwt.authenticateJwt);

// Get comprehensive dashboard data
dashboardRouter.get(
  "/",
  dashboardController.getDashboardDataController
);

// Get user statistics
dashboardRouter.get(
  "/users",
  dashboardController.getUserStatsController
);

// Get Stripe statistics
dashboardRouter.get(
  "/stripe",
  dashboardController.getStripeStatsController
);

// Get service statistics
dashboardRouter.get(
  "/services",
  dashboardController.getServiceStatsController
);

// Get service provider statistics
dashboardRouter.get(
  "/service-providers",
  dashboardController.getServiceProviderStatsController
);

export default dashboardRouter;

