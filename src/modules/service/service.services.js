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
import timelineRepository from "../timeline/timeline.repository.js";
import VariantRepository from "../variant/variant.repository.js";

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
const safeJsonParseVariants = (value, serviceId = null) => {
  if (!value) return null;
  // important i move the parsing of the data to the validator and not here
  if (!Array.isArray(value)) {
    throw new AppError(
      400,
      `Variants must be an array`,
      false,
      `Variants must be an array`,
    );
  }

  try {
    return value.map((i) => {
      const variant = {
        label: i.label,
        price: Number(i.price) || 0,
        deliveryTime: parseInt(i.deliveryTime) || 0,
      };
      // Only inject serviceId if we have one (Update mode)
      const finalId = i.serviceId || serviceId;
      if (finalId) {
        variant.serviceId = finalId;
      }

      return variant;
    });
  } catch (err) {
    // This catches mapping crashes, but the Validator should prevent this anyway :D
    throw new AppError(
      429,
      `Invalid data structure in variants`,
      false,
      "Invalid data structure in variants",
    );
  }
};

const safeJsonParseTimelines = (value, serviceId = null) => {
  if (!value) return null;
  // important i move the parsing of the data to the validator and not here
  // im just white listing the inputs
  if (!Array.isArray(value)) {
    throw new AppError(
      429,
      `Timelines must be an array`,
      false,
      "Timelines must be an array",
    );
  }

  try {
    return value.map((i) => {
      const timeline = {
        label: i.label,
        price: Number(i.price) || 0,
        startDate: i.startDate,
        deadlineDate: i.deadlineDate,
        endDate: i.endDate,
        maxParticipants: parseInt(i.maxParticipants) || 1,
      };

      // Only inject serviceId if we have one
      const finalId = i.serviceId || serviceId;
      if (finalId) {
        timeline.serviceId = finalId;
      }

      return timeline;
    });
  } catch (err) {
    throw new AppError(
      429,
      `Invalid data structure in timelines`,
      false,
      "Invalid data structure in timelines",
    );
  }
};
/* ---------------- Main Services ---------------- */

async function createService(req, transaction) {
  const requestedStatus = req.body.status || false;
  let serviceData = {
    userId: req.auth.id,
    serviceProviderId: req.auth.relatedId,
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    subcategoryId: hashIdUtil.hashIdDecode(req.body.subcategoryId),
    requirements: req.body.requirements,
    status:
      requestedStatus === "review"
        ? SERVICES_STATUS.pending
        : SERVICES_STATUS.draft,
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
  if (serviceData.variants && serviceData.timelines) {
    throw new AppError(
      422,
      "invalid option for timeline or variants",
      false,
      "service cant be both",
    );
  }

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
  return service;
}

// this really important controller basically all services and roles and even timelines and variants uses it
async function getAllServices(filters, authority) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;
  const where = {};
  let order = [["createdAt", "DESC"]];
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
  if (filters.order && filters.orderBy)
    order = [[filters.orderBy, filters.order]];

  const include = [
    {
      model: db.Timeline,
      required: false,
      where: { isArchived: false },
      as: "timelines",
      attributes: [
        "id",
        "label",
        "price",
        "startDate",
        "endDate",
        "deadlineDate",
        "maxParticipants",
      ],
    },
    {
      model: db.Variant,
      required: false,
      as: "variants",
      // offers will be excluded
      where: { isOffer: false, isArchived: false },
      attributes: ["id", "price", "label", "deliveryTime"],
    },
    { model: db.Asset, as: "image", attributes: ["url"] },
    { model: db.ServiceProvider, attributes: ["name"] },
    {
      // i will add filtersation
      model: db.Subcategory,
      attributes: ["title", "id", "label"],
      include: [{ model: db.Category, attributes: ["title", "id", "label"] }],
      ...(filters.category && { where: { title: filters.category } }),
    },
  ];

  const result = await serviceRepository.findAndCountAll({
    where,
    limit,
    offset,
    include,
    order,
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
        where: { isArchived: false, deadlineDate: { [Op.gte]: new Date() } },
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
        include: {
          model: db.Category,
          attributes: ["title", "id", "label"],
        },
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
  const requestedStatus = req.body.status || false;
  let updateData = {
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    subcategoryId: hashIdUtil.hashIdDecode(req.body.subcategoryId),
    requirements: req.body.requirements,
    status:
      requestedStatus === "review"
        ? SERVICES_STATUS.pending
        : SERVICES_STATUS.draft,
  };

  if (updateData.type === SERVICE_TYPES.timeline) {
    updateData.timelines = safeJsonParseTimelines(
      req.body.timelines,
      service.id,
    );
    updateData.variants = null;
  } else if (updateData.type === SERVICE_TYPES.oneTime) {
    updateData.variants = safeJsonParseVariants(req.body.variants, service.id);
    updateData.timelines = null;
  }

  // 3. Update Core Service Data
  const updatedService = await serviceRepository.update(updateData, {
    where: { id: serviceId, serviceProviderId: req.auth.relatedId },
    transaction: transaction,
    returning: true,
  });
  // i should delete all the old options and then add the new ones but at this stage i dont know its either a timeline or a variant
  // so im going to delete all the old options and then add the new ones

  // 4.handling the options
  // a. delete all the old options
  await timelineRepository.deleteTimelines({
    where: { serviceId: service.id },
    transaction: transaction,
  });
  await VariantRepository.deleteVariants({
    where: { serviceId: service.id },
    transaction: transaction,
  });
  // b. add the new options
  if (updateData.type === SERVICE_TYPES.timeline) {
    await timelineRepository.bulkCreateTimelines(
      updateData.timelines,
      transaction,
    );
  } else if (updateData.type === SERVICE_TYPES.oneTime) {
    await VariantRepository.bulkCreateVariants(
      updateData.variants,
      transaction,
    );
  }
  // 5. Update Assets
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
  return updatedService[1][0].toJSON();
  // i will add the notification outside to make sure of the transaction success
}

/* ---------------- Status & Logic ---------------- */

async function alterServiceStatus({ id, status, rejectionReason }) {
  const service = await serviceRepository.findByPk(id);
  if (!service) throw new AppError(400, "failed to find service");
  if (service.status === SERVICES_STATUS.draft)
    throw new AppError(400, "service is in draft");
  if (status === SERVICES_STATUS.approved) {
    service.status = SERVICES_STATUS.approved;
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
  return;
}
async function pauseResumeService(id, action, auth) {
  const serviceId = hashIdUtil.hashIdDecode(id);
  const service = await serviceRepository.findOne({
    where: { id: serviceId, serviceProviderId: auth.relatedId },
  });
  if (!service) throw new AppError(400, "failed to find service");
  service.isPaused = action === SERVICE_ACTIONS.PAUSE;
  await service.save();
  const event =
    action === SERVICE_ACTIONS.PAUSE
      ? NOTIFICATION_EVENTS.SERVICE.PAUSED
      : NOTIFICATION_EVENTS.SERVICE.RESUMED;
  notificationQueue.add(event, { serviceId });
  return;
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
  const event = NOTIFICATION_EVENTS.SERVICE.REQUESTED_REVIEW;
  notificationQueue.add(event, { serviceId: service.id });
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
  alterServiceStatus,
  getServiceProfileForAdminAndSP,
  updateServiceRating,
  alterFavorite,
  getClientServices,
};

export default serviceServices;
