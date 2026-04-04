import { Op } from "sequelize";
import db from "../../database/index.js";
import { AppError } from "../../utils/error.class.js";
import serviceRepository from "./service.repository.js";
import hashIdUtil from "../../utils/hashId.util.js";
import AssetService from "../../services/assts.services.js";
import {
  NOTIFICATION_EVENTS,
  SERVICE_ACTIONS,
  SERVICE_TYPES,
  SERVICES_STATUS,
} from "../../configs/constants.js";
import notificationQueue from "../../jobs/queues/notification.queue.js";
import AssetRepository from "../assets/assets.repository.js";
import { app } from "../../app.js";

const publicAttributes = [
  "id",
  "title",
  "description",
  "serviceProviderId",
  "views",
  "type",
  "rating",
  "status",
  "totalReviews",
  "requirements",
];
const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return str;
  }
};
const safeJsonParseVariants = (value, fieldName) => {
  if (!value) return null;
  try {
    const variants = JSON.parse(value);
    // im just white listing the inputs
    // TODO: add validation
    return variants.map((i) => ({
      label: i.label,
      price: i.price,
      deliveryTime: i.deliveryTime,
    }));
    return JSON.parse(value);
  } catch {
    throw new AppError(400, `Invalid JSON in ${fieldName}`);
  }
};
const safeJsonParseTimelines = (value, fieldName) => {
  if (!value) return null;
  try {
    const timelines = JSON.parse(value);
    // im just white listing the inputs
    // TODO: add validation
    return timelines.map((i) => ({
      label: i.label,
      price: i.price,
      startDate: i.startDate,
      deadlineDate: i.deadlineDate,
      endDate: i.endDate,
      maxParticipants: i.maxParticipants,
    }));
    return JSON.parse(value);
  } catch {
    throw new AppError(400, `Invalid JSON in ${fieldName}`);
  }
};

/* ---------------- Main Services ---------------- */

async function createService(req, transaction) {
  let serviceData = {
    userId: req.auth.id,
    serviceProviderId: req.auth.relatedId,
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    subcategoryId: hashIdUtil.hashIdDecode(req.body.subcategoryId),
    requirements: req.body.requirements,
  };
  if (serviceData.type === SERVICE_TYPES.timeline) {
    serviceData.timelines = safeJsonParseTimelines(
      req.body.timelines,
      "timelines",
    );
  } else if (serviceData.type === SERVICE_TYPES.oneTime) {
    serviceData.variants = safeJsonParseVariants(req.body.variants, "variants");
  }
  if (!serviceData.variants && !serviceData.timelines)
    throw new AppError(422, "invalid option for timeline or variants");

  const service = await serviceRepository.createService(
    serviceData,
    transaction,
  );

  const files = req.files || [];
  const imageKeys = req.body.imageKeys || [];
  if (files.length !== imageKeys.length)
    throw new Error("Files and imageKeys length mismatch");

  const groupedFiles = {};
  files.forEach((file, index) => {
    const type = imageKeys[index];
    if (!groupedFiles[type]) groupedFiles[type] = [];
    groupedFiles[type].push(file);
  });

  for (const [type, files] of Object.entries(groupedFiles)) {
    await AssetService.upload({
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
    if (filters.status) where.status = SERVICES_STATUS[filters.status];
    if (filters.isPaused) where.isPaused = filters.isPaused;
  } else if (authority === "serviceProvider") {
    where.serviceProviderId = filters.serviceProvider;
    if (filters.status) where.status = SERVICES_STATUS[filters.status];
    if (filters.isPaused) where.isPaused = filters.isPaused;
  } else {
    where.status = SERVICES_STATUS.approved;
    where.isPaused = false;
  }

  if (filters.maxRating || filters.minRating) {
    where.rating = {};
    if (filters.minRating) where.rating[Op.gte] = filters.minRating;
    if (filters.maxRating) where.rating[Op.lte] = filters.maxRating;
  }
  if (filters.id) where.id = filters.id;
  if (filters.title) where.title = { [Op.iLike]: `%${filters.title}%` };
  if (filters.type) where.type = filters.type;
  if (filters.serviceProvider && authority !== "serviceProvider")
    where.serviceProviderId = filters.serviceProvider;

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
        "maxParticipants",
      ],
    },
    {
      model: db.Variant,
      required: false,
      as: "variants",
      attributes: ["id", "price", "label", "isArchived", "deliveryTime"],
    },
    { model: db.Asset, as: "image", attributes: ["url"] },
    { model: db.ServiceProvider, attributes: ["name"] },
    {
      model: db.Subcategory,
      attributes: ["title"],
      ...(filters.category && { where: { title: filters.category } }),
    },
  ];

  const result = await serviceRepository.findAndCountAll({
    where,
    limit,
    offset,
    include,
  });

  return {
    page,
    limit,
    total: result.count,
    totalPages: Math.ceil(result.count / limit),
    data: result.rows,
  };
}

async function getServiceByIdPublic(id) {
  const service = await serviceRepository.findOne({
    where: { status: SERVICES_STATUS.approved, isPaused: false, id },
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
      { model: db.Subcategory, attributes: ["title", "id", "label"] },
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
        attributes: ["id", "name", "email", "phoneNumber", "isVerified"],
      },
    ],
  });

  if (!service) throw new AppError(404, "Service not found");
  await service.increment("views");
  return service.toJSON();
}

async function getServiceProfileForAdminAndSP(id, SPID) {
  const where = { id };
  if (SPID) where.serviceProviderId = SPID;
  const service = await serviceRepository.findOne({
    where,
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
        include: [{ model: db.Category, attributes: ["title", "id", "label"] }],
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
        attributes: ["id", "name", "email", "phoneNumber", "isVerified"],
      },
    ],
  });

  if (!service) throw new AppError(404, "Service not found");
  await service.increment("views");
  return service.toJSON();
}

async function getClientServices(userId) {
  return await serviceRepository.findAll({
    attributes: publicAttributes,
    include: [
      {
        model: db.Order,
        required: true,
        attributes: ["id"],
        where: {
          userId,
          status: { [Op.or]: ["paid", "fulfilled", "completed"] },
        },
        include: [
          { model: db.Timeline, attributes: ["id", "label"], required: true },
        ],
      },
    ],
  });
}

async function updateService(serviceId, req, transaction) {
  // 1. Check if the service exists
  const service = await serviceRepository.findOne({
    where: { id: serviceId, serviceProviderId: req.auth.relatedId },
  });
  if (!service)
    throw new AppError(400, "Service not found", false, "Service not found");
  if (service.status !== "draft" && service.status !== "rejected")
    throw new AppError(
      400,
      "service is not editable",
      false,
      "service is not editable",
    );
  let updateData = {
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    subcategoryId: hashIdUtil.hashIdDecode(req.body.subcategoryId),
    requirements: req.body.requirements,
    status: "draft",
  };

  if (updateData.type === SERVICE_TYPES.timeline) {
    updateData.timelines = safeJsonParseTimelines(
      req.body.timelines,
      "timelines",
    );
    updateData.variants = null;
  } else if (updateData.type === SERVICE_TYPES.oneTime) {
    updateData.variants = safeJsonParseVariants(req.body.variants, "variants");
    updateData.timelines = null;
  }

  // 3. Update Core Service Data
  await serviceRepository.update(updateData, {
    where: { id: serviceId, serviceProviderId: req.auth.relatedId },
    transaction: transaction,
  });

  // step one delete the deleted assets
  const deletedAssets = safeJsonParse(req.body.deletedAssets);
  if (deletedAssets) {
    await AssetRepository.deleteAssets({
      where: {
        name: { [Op.in]: deletedAssets },
        serviceProviderId: req.auth.relatedId,
      },
      transaction: transaction,
    });
  }
  // step two upload the new assets only if they exist
  const files = req.files || [];
  const imageKeys = req.body.imageKeys || [];
  if (files.length !== imageKeys.length)
    throw new Error("Files and imageKeys length mismatch");

  const groupedFiles = {};
  files.forEach((file, index) => {
    const type = imageKeys[index];
    if (!groupedFiles[type]) groupedFiles[type] = [];
    groupedFiles[type].push(file);
  });

  for (const [type, files] of Object.entries(groupedFiles)) {
    await AssetService.upload({
      type,
      files,
      auth: req.auth,
      params: { id: hashIdUtil.hashIdEncode(service.id) },
      transaction,
    });
  }
}

async function deleteService(id) {
  const service = await serviceRepository.findByPk(id);
  if (!service) throw new AppError(404, "Service not found");
  return await service.destroy();
}

async function restoreService(id) {
  const service = await serviceRepository.findByPk(id, { paranoid: false });
  if (!service) throw new AppError(404, "Service not found");
  if (!service.deletedAt) throw new AppError(400, "Service isn't deleted");
  return await service.restore();
}

/* ---------------- Status & Logic ---------------- */

async function alterServiceStatus({ id, status, rejectionReason }) {
  const service = await serviceRepository.findByPk(id);
  if (!service) throw new AppError(400, "failed to find service");
  if (service.status === SERVICES_STATUS.draft)
    throw new AppError(400, "service is in draft");

  if (status === SERVICES_STATUS.approved) {
    service.status = SERVICES_STATUS.approved;
    service.rejectionReason = null; // Fix: Clear rejection reason on success
  } else if (status === SERVICES_STATUS.rejected) {
    if (!rejectionReason?.trim())
      throw new AppError(400, "rejection reason is required");
    service.status = SERVICES_STATUS.rejected;
    service.rejectionReason = rejectionReason;
  } else {
    throw new AppError(400, "failed to process request");
  }

  await service.save();

  const event =
    status === "approved"
      ? NOTIFICATION_EVENTS.SERVICE.APPROVED
      : NOTIFICATION_EVENTS.SERVICE.REJECTED;
  notificationQueue.add(event, { serviceId: id });
}

async function pauseResumeService(id, action, auth) {
  const service = await serviceRepository.findOne({
    where: { id, serviceProviderId: auth.relatedId },
  });
  if (!service) throw new AppError(400, "failed to find service");
  service.isPaused = action === SERVICE_ACTIONS.PAUSE;
  return await service.save();
}

async function requestApproval(serviceId, providerId) {
  const service = await serviceRepository.findOne({
    where: { id: serviceId, serviceProviderId: providerId },
  });
  if (!service) throw new AppError(400, "failed to find service");
  if (
    service.status !== SERVICES_STATUS.draft &&
    service.status !== SERVICES_STATUS.rejected
  )
    throw new AppError(400, "service is not eligible for approval");

  service.status = SERVICES_STATUS.pending;
  await service.save();
}

/* ---------------- Ratings & Favorites ---------------- */

async function updateServiceRating(
  {
    serviceId,
    newRating = 0,
    isUpdate = false,
    oldRating = null,
    isDelete = false,
  } = {},
  t,
) {
  const service = await serviceRepository.findByPk(serviceId);
  if (!service) throw new AppError(404, "service not found");

  let { totalReviews = 0, rating: currentRating = 0 } = service;

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
    { rating: currentRating, totalReviews },
    { transaction: t },
  );
}

async function alterFavorite(serviceId, userId, status) {
  if (status === "add") {
    await db.Favorite.create({ serviceId, userId });
  } else if (status === "remove") {
    await db.Favorite.destroy({ where: { serviceId, userId } });
  } else {
    throw new AppError(500, "invalid status");
  }
}

const serviceServices = {
  requestApproval,
  createService,
  getAllServices,
  pauseResumeService,
  getServiceByIdPublic,
  updateService,
  deleteService,
  restoreService,
  alterServiceStatus,
  getServiceProfileForAdminAndSP,
  updateServiceRating,
  alterFavorite,
  getClientServices,
};

export default serviceServices;
