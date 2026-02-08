import dashboardServices from "./dashboard.services.js";
import authUtils from "../../utils/authorize.util.js";
import { AppError } from "../../utils/error.class.js";

/**
 * Get comprehensive dashboard data
 * Requires admin or super_admin role
 */
export const getDashboardDataController = async (req, res, next) => {
  try {
    // await authUtils.checkRoleAndPermission(
    //   req.auth,
    //   ["admin", "super_admin"],
    //   true,
    //   "dashboard",
    //   "read"
    // );

    const dashboardData = await dashboardServices.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 */
export const getUserStatsController = async (req, res, next) => {
  try {
    await authUtils.checkRoleAndPermission(
      req.auth,
      ["admin", "super_admin"],
      true,
      "dashboard",
      "read"
    );

    const [totalUsers, demographics, rolesDistribution, registrationFrequency] =
      await Promise.all([
        dashboardServices.getTotalUsers(),
        dashboardServices.getUserDemographics(),
        dashboardServices.getUserRolesDistribution(),
        dashboardServices.getUserRegistrationFrequency(30),
      ]);

    res.json({
      total: totalUsers,
      demographics,
      rolesDistribution,
      registrationFrequency,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Stripe statistics
 */
export const getStripeStatsController = async (req, res, next) => {
  try {
    await authUtils.checkRoleAndPermission(
      req.auth,
      ["admin", "super_admin"],
      true,
      "dashboard",
      "read"
    );

    const stripeStats = await dashboardServices.getStripeStatistics();
    res.json(stripeStats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get service statistics
 */
export const getServiceStatsController = async (req, res, next) => {
  try {
    await authUtils.checkRoleAndPermission(
      req.auth,
      ["admin", "super_admin"],
      true,
      "dashboard",
      "read"
    );

    const [totalServices, byType, popularCategories, mostRegistered] =
      await Promise.all([
        dashboardServices.getTotalServices(),
        dashboardServices.getServicesByType(),
        dashboardServices.getMostPopularCategories(10),
        dashboardServices.getMostRegisteredServices(10),
      ]);

    res.json({
      total: totalServices,
      byType,
      popularCategories,
      mostRegistered,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get service provider statistics
 */
export const getServiceProviderStatsController = async (req, res, next) => {
  try {
    await authUtils.checkRoleAndPermission(
      req.auth,
      ["admin", "super_admin"],
      true,
      "dashboard",
      "read"
    );

    const mostSuccessful =
      await dashboardServices.getMostSuccessfulServiceProviders(10);
    res.json({ mostSuccessful });
  } catch (error) {
    next(error);
  }
};

const dashboardController = {
  // getDashboardDataController,
  getUserStatsController,
  getStripeStatsController,
  getServiceStatsController,
  getServiceProviderStatsController,
};

export default dashboardController;

