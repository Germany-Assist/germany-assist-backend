import { Op, Sequelize } from "sequelize";
import db from "../../database/index.js";

/**
 * Get total number of users
 */
export const getTotalUsers = async () => {
  return await db.User.count();
};

/**
 * Get user demographics
 * OPTIMIZED: Uses SQL CASE to group ages in the DB rather than fetching all users into memory.
 */
export const getUserDemographics = async () => {
  const result = await db.User.findAll({
    attributes: [
      [
        Sequelize.literal(`CASE 
          WHEN date_part('year', age(dob)) BETWEEN 18 AND 25 THEN '18-25'
          WHEN date_part('year', age(dob)) BETWEEN 26 AND 35 THEN '26-35'
          WHEN date_part('year', age(dob)) BETWEEN 36 AND 45 THEN '36-45'
          WHEN date_part('year', age(dob)) BETWEEN 46 AND 55 THEN '46-55'
          WHEN date_part('year', age(dob)) >= 56 THEN '56+'
          ELSE 'unknown'
        END`),
        'ageGroup'
      ],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['ageGroup'],
    raw: true
  });

  // Initialize structure to ensure all keys exist even if count is 0
  const ageGroups = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0, "unknown": 0 };

  result.forEach(row => {
    ageGroups[row.ageGroup] = parseInt(row.count);
  });

  return ageGroups;
};

/**
 * Get user roles distribution
 */
export const getUserRolesDistribution = async () => {
  const roles = await db.UserRole.findAll({
    attributes: [
      "role",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    group: ["role"],
    raw: true,
  });

  return roles.reduce((acc, curr) => {
    acc[curr.role] = parseInt(curr.count);
    return acc;
  }, {});
};

/**
 * Get user registration frequency
 */
export const getUserRegistrationFrequency = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const registrations = await db.User.findAll({
    attributes: [
      [Sequelize.fn("DATE", Sequelize.col("created_at")), "date"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    where: { createdAt: { [Op.gte]: startDate } },
    group: [Sequelize.fn("DATE", Sequelize.col("created_at"))],
    order: [[Sequelize.fn("DATE", Sequelize.col("created_at")), "ASC"]],
    raw: true,
  });

  return registrations.map((reg) => ({
    date: reg.date,
    count: parseInt(reg.count),
  }));
};

/**
 * Get Stripe statistics
 * OPTIMIZED: Uses Promise.all for internal concurrency
 */
export const getStripeStatistics = async () => {
  const queries = [
    db.StripeEvent.count(),
    db.StripeEvent.findAll({
      attributes: ["type", [Sequelize.fn("COUNT", "id"), "count"]],
      group: ["type"],
      raw: true
    }),
    db.StripeEvent.findAll({
      attributes: ["status", [Sequelize.fn("COUNT", "id"), "count"]],
      group: ["status"],
      raw: true
    }),
    db.Order.count({
      where: { status: { [Op.in]: ["paid", "fulfilled", "completed"] } }
    }),
    db.Order.sum("amount", {
      where: { status: { [Op.in]: ["paid", "fulfilled", "completed"] } }
    })
  ];

  const [totalEvents, types, statuses, successfulPayments, totalRevenue] = await Promise.all(queries);

  return {
    totalEvents,
    eventsByType: types.reduce((acc, c) => ({ ...acc, [c.type]: parseInt(c.count) }), {}),
    eventsByStatus: statuses.reduce((acc, c) => ({ ...acc, [c.status]: parseInt(c.count) }), {}),
    successfulPayments,
    totalRevenue: totalRevenue || 0,
  };
};

/**
 * Get total services
 */
export const getTotalServices = async () => db.Service.count();

/**
 * Get services by type
 */
export const getServicesByType = async () => {
  const services = await db.Service.findAll({
    attributes: ["type", [Sequelize.fn("COUNT", "id"), "count"]],
    group: ["type"],
    raw: true,
  });

  return services.reduce((acc, s) => ({ ...acc, [s.type]: parseInt(s.count) }), {});
};

/**
 * Get most popular service categories
 */
export const getMostPopularCategories = async (limit = 10) => {
  const popularCategories = await db.Service.findAll({
    attributes: [
      "categoryId",
      [Sequelize.fn("COUNT", Sequelize.col("Service.id")), "serviceCount"],
    ],
    include: [{
      model: db.Category,
      attributes: ["id", "title", "label"],
    }],
    group: ["Service.category_id", "Category.id"],
    order: [[Sequelize.fn("COUNT", Sequelize.col("Service.id")), "DESC"]],
    limit,
  });

  return popularCategories.map((service) => ({
    categoryId: service.categoryId,
    categoryTitle: service.Category?.title || "Unknown",
    categoryLabel: service.Category?.label || "Unknown",
    serviceCount: parseInt(service.get("serviceCount")),
  }));
};

/**
 * Get most registered services
 * FIXED: Replaced brittle literal with accurate table referencing
 */
export const getMostRegisteredServices = async (limit = 10) => {
  const popularServices = await db.Service.findAll({
    attributes: [
      "id", "title", "price", "rating", "totalReviews", "views",
      [
        Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "${db.Order.tableName}" AS orders
          WHERE orders.service_id = "Service"."id"
          AND orders.status IN ('paid', 'fulfilled', 'completed')
          AND orders.deleted_at IS NULL
        )`),
        "orderCount",
      ],
    ],
    order: [[Sequelize.literal('"orderCount"'), "DESC"]],
    limit,
    raw: true
  });

  return popularServices.map(s => ({ ...s, orderCount: parseInt(s.orderCount) }));
};

/**
 * Get most successful service providers
 */
export const getMostSuccessfulServiceProviders = async (limit = 10) => {
  return await db.ServiceProvider.findAll({
    attributes: [
      "id", "name", "rating", "totalReviews",
      [Sequelize.fn("COUNT", Sequelize.col("Services.id")), "serviceCount"],
      [Sequelize.fn("AVG", Sequelize.col("Services.rating")), "avgRating"]
    ],
    include: [{
      model: db.Service,
      as: 'Services',
      attributes: [],
      required: false,
    }],
    group: ["ServiceProvider.id"],
    order: [[Sequelize.literal('"serviceCount"'), "DESC"]],
    limit,
    subQuery: false,
  });
};

/**
 * Get comprehensive dashboard data
 */
export const getDashboardData = async () => {
  const [
    totalUsers, userDemographics, userRoles, userRegs,
    stripe, totalServices, servicesByType,
    popCategories, regServices, successfulProviders
  ] = await Promise.all([
    getTotalUsers(),
    getUserDemographics(),
    getUserRolesDistribution(),
    getUserRegistrationFrequency(30),
    getStripeStatistics(),
    getTotalServices(),
    getServicesByType(),
    getMostPopularCategories(10),
    getMostRegisteredServices(10),
    getMostSuccessfulServiceProviders(10),
  ]);

  return {
    users: { total: totalUsers, demographics: userDemographics, rolesDistribution: userRoles, registrationFrequency: userRegs },
    stripe,
    services: { total: totalServices, byType: servicesByType, mostPopularCategories: popCategories, mostRegistered: regServices },
    serviceProviders: { mostSuccessful: successfulProviders },
  };
};

export default { getDashboardData };