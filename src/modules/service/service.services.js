import { col, fn, literal, Op } from "sequelize";
import db from "../../database/index.js";
import { AppError } from "../../utils/error.class.js";
import serviceRepository from "./service.repository.js";
import serviceMappers from "./service.mappers.js";
import hashIdUtil from "../../utils/hashId.util.js";
import AssetService from "../../services/assts.services.js";
import serviceProviderRepository from "../serviceProvider/serviceProvider.repository .js";
import { NOTIFICATION_EVENTS } from "../../configs/constants.js";
import notificationQueue from "../../jobs/queues/notification.queue.js";
const publicAttributes = [
  "id",
  "title",
  "description",
  "serviceProviderId",
  "views",
  "type",
  "rating",
  "totalReviews",
];
const safeJsonParse = (value, fieldName) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    throw new AppError(400, `Invalid JSON in ${fieldName}`);
  }
};
async function createService(req, transaction) {
  let serviceData = {
    userId: req.auth.id,
    serviceProviderId: req.auth.relatedId,
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    rating: 0,
    totalReviews: 0,
    image: null,
    published: req.body.publish
      ? req.auth.role === "service_provider_root"
      : false,
    subcategoryId: hashIdUtil.hashIdDecode(req.body.subcategory),
  };

  await serviceProviderRepository.checkIfSPAllowedCategory(
    req.auth.relatedId,
    hashIdUtil.hashIdDecode(req.body.category),
    transaction,
  );
  if (serviceData.type === "timeline") {
    serviceData.timelines = safeJsonParse(req.body.timelines, "timelines");
  } else if (serviceData.type === "oneTime") {
    serviceData.variants = safeJsonParse(req.body.variants, "variants");
  }
  if (!serviceData.variants && !serviceData.timelines)
    throw new AppError(
      422,
      "invalid option",
      true,
      "invalid option for timeline or variants",
    );
  const service = await serviceRepository.createService(
    serviceData,
    transaction,
  );

  const files = req.files || [];
  const imageKeys = req.body.imageKeys || [];

  if (files.length !== imageKeys.length) {
    throw new Error("Files and imageKeys length mismatch");
  }

  const groupedFiles = {};
  files.forEach((file, index) => {
    const type = imageKeys[index];
    if (!groupedFiles[type]) groupedFiles[type] = [];
    groupedFiles[type].push(file);
  });

  for (const [type, files] of Object.entries(groupedFiles)) {
    const assets = await AssetService.upload({
      type,
      files,
      auth: req.auth,
      params: { id: hashIdUtil.hashIdEncode(service.id) },
      transaction,
    });
  }
  notificationQueue.add(NOTIFICATION_EVENTS.SERVICE.CREATED, {
    serviceId: service.id,
  });
  return service;
}

async function getAllServices(filters, authority) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;
  const where = {};
  if (authority === "admin") {
    if (filters.approved) where.approved = filters.approved;
    if (filters.rejected) where.rejected = filters.rejected;
    if (filters.published) where.published = filters.published;
  } else if (authority === "serviceProvider") {
    where.serviceProviderId = filters.serviceProvider;
    if (filters.approved) where.approved = filters.approved;
    if (filters.rejected) where.rejected = filters.rejected;
    if (filters.published) where.published = filters.published;
  } else {
    where.approved = true;
    where.rejected = false;
    where.published = true;
  }
  if (filters.maxRating || filters.minRating) {
    where.rating = {};
    if (filters.minRating) where.rating[Op.gte] = filters.minRating;
    if (filters.maxRating) where.rating[Op.lte] = filters.maxRating;
  }
  if (filters.id) where.id = filters.id;
  if (filters.title) where.title = { [Op.iLike]: `%${filters.title}%` };
  if (filters.type) where.type = filters.type;
  if (filters.serviceProvider && authority !== "serviceProvider") {
    where.serviceProviderId = filters.serviceProvider;
  }
  const include = [
    {
      model: db.Timeline,
      required: false,
      as: "timelines",
      attributes: [
        "id",
        "price",
        "startDate",
        "endDate",
        "label",
        "isArchived",
        "deadlineDate",
        "limit",
      ],
    },
    {
      model: db.Variant,
      required: false,
      as: "variants",
      attributes: ["id", "price", "label", "isArchived", "limit"],
    },
    { model: db.Asset, as: "image", attributes: ["url"] },
    { model: db.ServiceProvider, attributes: ["name"] },
    {
      model: db.Subcategory,
      attributes: ["title"],
      ...(filters.category && { where: { title: filters.category } }),
    },
  ];
  const total = await db.Service.count({
    where,
    distinct: true,
    col: "id",
  });
  const rows = await db.Service.findAll({
    where,
    distinct: true,
    // subQuery: false,
    attributes: [
      ...publicAttributes,
      "approved",
      "published",
      "rejected",
      "created_at",
    ],
    include,
    limit,
    offset,
  });
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: rows,
  };
}

async function getServiceByIdPublic(id) {
  const service = await db.Service.findOne({
    where: { id, approved: true, rejected: false, published: true },
    raw: false,
    attributes: publicAttributes,
    include: [
      {
        model: db.Asset,
        attributes: ["mediaType", "key", "confirmed", "url", "name", "thumb"],
      },
      {
        model: db.Timeline,
        where: { isArchived: false },
        as: "timelines",

        required: false,
      },
      {
        model: db.Variant,
        where: { isArchived: false },
        as: "variants",

        required: false,
      },
      {
        model: db.Subcategory,
        attributes: ["title", "id", "label"],
      },
      {
        model: db.Review,
        attributes: ["body", "rating"],
        limit: 4,
        include: {
          model: db.User,
          attributes: ["firstName", "lastName", "id"],
          as: "user",
        },
      },
      {
        model: db.ServiceProvider,
        //TODO to create sp card
        attributes: ["id", "name", "email", "phoneNumber", "isVerified"],
      },
    ],
  });

  if (!service)
    throw new AppError(404, "Service not found", true, "Service not found");
  service.increment("views");
  await service.save();
  return service.toJSON();
}
async function getServiceProfileForAdminAndSP(id, SPID) {
  const where = { id };
  if (SPID) where.serviceProviderId = SPID;
  const service = await db.Service.findOne({
    where,
    raw: false,
    attributes: [...publicAttributes, "approved", "rejected", "published"],
    include: [
      {
        model: db.Asset,
        attributes: ["mediaType", "key", "confirmed", "url", "name", "thumb"],
      },
      {
        model: db.Subcategory,
        attributes: ["title"],
      },
      {
        model: db.Review,
        attributes: ["body", "rating"],
        include: {
          model: db.User,
          attributes: ["firstName", "lastName", "id"],
        },
      },
      {
        model: db.User,
        attributes: ["firstName", "lastName", "email"],
      },
      {
        model: db.Timeline,
        attributes: ["id", "isArchived", "label"],
      },
    ],
  });
  if (!service)
    throw new AppError(404, "Service not found", true, "Service not found");
  return service.toJSON();
}
async function getClientServices(userId) {
  return await db.Service.findAll({
    attributes: publicAttributes,
    include: [
      {
        model: db.Order,
        required: true,
        attributes: ["id"],
        where: {
          userId: userId,
          status: { [Op.or]: ["paid", "fulfilled", "completed"] },
        },
        include: [
          {
            model: db.Timeline,
            attributes: ["id", "label"],
            required: true,
          },
        ],
      },
    ],
  });
}
async function updateService(id, updateData) {
  const service = await db.Service.findByPk(id);
  if (!service)
    throw new AppError(404, "Service not found", true, "Service not found");
  return service.update(updateData);
}
async function deleteService(id) {
  const service = await db.Service.findOne({
    where: { id },
  });
  if (!service)
    throw new AppError(404, "Service not found", true, "Service not found");
  return await service.destroy();
}
async function restoreService(id) {
  const service = await db.Service.findByPk(id, { paranoid: false });
  if (!service)
    throw new AppError(404, "Service not found", true, "Service not found");
  if (!service.deletedAt)
    throw new AppError(
      400,
      "Service isn't deleted",
      true,
      "Service isn't deleted",
    );
  return await service.restore();
}
async function alterServiceStatus(id, status) {
  const service = await db.Service.findByPk(id);
  if (!service) throw new AppError(400, "failed to find service", false);
  if (status === "approve") {
    service.rejected = false;
    service.approved = true;
  } else if (status === "reject") {
    service.rejected = true;
    service.approved = false;
  } else {
    throw new AppError(400, "failed to process request", false);
  }
  await service.save();

  switch (status) {
    case "approve":
      notificationQueue.add(NOTIFICATION_EVENTS.SERVICE.APPROVED, {
        serviceId: id,
      });
      break;
    case "reject":
      notificationQueue.add(NOTIFICATION_EVENTS.SERVICE.REJECTED, {
        serviceId: id,
      });
      break;
    default:
      break;
  }
  return;
}
async function alterServiceStatusSP(id, status) {
  const service = await db.Service.findByPk(id);
  if (!service) throw new AppError(400, "failed to find service", false);
  if (status === "publish") {
    service.published = true;
  } else if (status === "unpublish") {
    service.published = false;
  } else {
    throw new AppError(400, "failed to process request", false);
  }
  return await service.save();
}
export const updateServiceRating = async (
  {
    serviceId,
    newRating = 0,
    isUpdate = false,
    oldRating = null,
    isDelete = false,
  } = {},
  t,
) => {
  if (typeof newRating !== "number" || newRating < 0 || newRating > 5) {
    throw new AppError(400, "Invalid rating value", true);
  }
  const service = await db.Service.findByPk(serviceId);
  if (!service) {
    throw new AppError(404, "service not found", true, "service not found");
  }
  let { totalReviews: totalReviews = 0, rating: currentRating = 0 } = service;

  if (isDelete) {
    if (totalReviews <= 1) {
      totalReviews = 0;
      currentRating = 0;
    } else {
      totalReviews -= 1;
      currentRating =
        (currentRating * (totalReviews + 1) - newRating) / totalReviews;
    }
  } else if (isUpdate && oldRating !== null) {
    currentRating =
      (currentRating * totalReviews - oldRating + newRating) / totalReviews;
  } else {
    totalReviews += 1;
    currentRating =
      (currentRating * (totalReviews - 1) + newRating) / totalReviews;
  }

  return await service.update(
    {
      rating: currentRating,
      totalReviews: totalReviews,
    },
    { transaction: t },
  );
};
export async function alterFavorite(serviceId, userId, status) {
  if (status === "add") {
    await db.Favorite.create({
      serviceId: serviceId,
      userId: userId,
    });
  } else if (status === "remove") {
    await db.Favorite.destroy({
      where: { serviceId: serviceId, userId: userId },
    });
  } else {
    throw new AppError(500, "invalid status", false);
  }
}

const serviceServices = {
  createService,
  getAllServices,
  getServiceByIdPublic,
  updateService,
  deleteService,
  restoreService,
  alterServiceStatus,
  alterServiceStatusSP,
  getServiceProfileForAdminAndSP,
  updateServiceRating,
  alterFavorite,
  getClientServices,
};
export default serviceServices;
