import serviceServices from "./service.services.js";
import hashIdUtil from "../../utils/hashId.util.js";
import authUtils from "../../utils/authorize.util.js";
import { sequelize } from "../../configs/database.js";
import serviceMappers from "./service.mappers.js";
import { AppError } from "../../utils/error.class.js";
import { NOTIFICATION_EVENTS } from "../../configs/constants.js";
import notificationQueue from "../../jobs/queues/notification.queue.js";

export async function createService(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    await authUtils.checkRoleAndPermission(
      req.auth,
      ["service_provider_root", "service_provider_rep"],
      true,
      "service",
      "create",
    );
    const service = await serviceServices.createService(req, transaction);
    await transaction.commit();
    notificationQueue.add(NOTIFICATION_EVENTS.SERVICE.CREATED, {
      serviceId: service.id,
    });
    return res.status(201).json({
      message: "successfully created service",
      data: { id: hashIdUtil.hashIdEncode(service.id) },
    });
  } catch (error) {
    if (req.files) {
      req.files.forEach((file) => {
        file.stream?.resume();
      });
    }
    if (req.file?.stream) {
      req.file.stream.resume();
    }
    await transaction.rollback();
    next(error);
  }
}

// this really important route basically all services and roles and even timelines and variants uses it
export async function getAllServices(req, res, next) {
  try {
    const services = await serviceServices.getAllServices(req.query);
    const sanitizedServices = await serviceMappers.sanitizeServices(
      services.data,
    );
    res.status(200).json({ ...services, data: sanitizedServices });
  } catch (error) {
    next(error);
  }
}
export async function getServiceProfile(req, res, next) {
  try {
    const service = await serviceServices.getServiceByIdPublic(
      hashIdUtil.hashIdDecode(req.params.id),
    );
    const sanitizedService =
      await serviceMappers.sanitizeServiceProfile(service);
    res.status(200).json(sanitizedService);
  } catch (error) {
    next(error);
  }
}
export async function getServiceProfileForAdminAndSP(req, res, next) {
  try {
    await authUtils.checkRoleAndPermission(req.auth, [
      "admin",
      "super_admin",
      "service_provider_rep",
      "service_provider_root",
    ]);
    const service = await serviceServices.getServiceProfileForAdminAndSP(
      hashIdUtil.hashIdDecode(req.params.id),
      req.auth.relatedId,
    );
    const sanitizedServices =
      await serviceMappers.sanitizeServiceProfile(service);
    res.status(200).json(sanitizedServices);
  } catch (error) {
    next(error);
  }
}
export async function getAllServicesAdmin(req, res, next) {
  try {
    await authUtils.checkRoleAndPermission(req.auth, ["admin", "super_admin"]);
    const services = await serviceServices.getAllServices(req.query, "admin");
    const sanitizedServices = await serviceMappers.sanitizeServices(
      services.data,
    );
    res.status(200).json({ ...services, data: sanitizedServices });
  } catch (error) {
    next(error);
  }
}
export async function getAllServicesSP(req, res, next) {
  try {
    await authUtils.checkRoleAndPermission(req.auth, [
      "service_provider_root",
      "service_provider_rep",
    ]);
    const filters = { ...req.query, serviceProvider: req.auth.relatedId };
    const services = await serviceServices.getAllServices(
      filters,
      "serviceProvider",
    );
    const sanitizedServices = await serviceMappers.sanitizeServices(
      services.data,
    );
    res.status(200).json({ ...services, data: sanitizedServices });
  } catch (error) {
    next(error);
  }
}
export async function updateService(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const serviceId = hashIdUtil.hashIdDecode(req.params.id);

    await authUtils.checkRoleAndPermission(
      req.auth,
      ["service_provider_root", "service_provider_rep"],
      true,
      "service",
      "update",
    );
    const updatedService = await serviceServices.updateService(
      serviceId,
      req,
      transaction,
    );
    await transaction.commit();
    if (updatedService.status === "pending") {
      const event = NOTIFICATION_EVENTS.SERVICE.REQUESTED_REVIEW;
      notificationQueue.add(event, { serviceId });
    }
    return res.status(200).json({
      message: "Successfully updated service",
      success: true,
    });
  } catch (error) {
    if (req.files) {
      req.files.forEach((file) => {
        file.stream?.resume();
      });
    }
    await transaction.rollback();
    next(error);
  }
}

export async function restoreService(req, res, next) {
  try {
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["admin", "super_admin"],
      false,
    );
    await serviceServices.restoreService(
      hashIdUtil.hashIdDecode(req.params.id),
    );
    res.send({ success: true, message: "Service Restored Successfully" });
  } catch (error) {
    next(error);
  }
}
export async function alterServiceStatus(req, res, next) {
  try {
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["admin", "super_admin"],
      false,
    );
    const { status, rejectionReason } = req.body;
    const { id } = req.params;
    await serviceServices.alterServiceStatus({
      id: hashIdUtil.hashIdDecode(id),
      status,
      rejectionReason,
    });

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export async function pauseResumeService(req, res, next) {
  try {
    const { action } = req.body;
    const { id } = req.params;
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["service_provider_rep", "service_provider_root"],
      true,
      "service",
      action,
    );
    await serviceServices.pauseResumeService(id, action, req.auth);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export async function addToFavorite(req, res, next) {
  try {
    const { id: serviceId } = req.params;
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["client"],
      false,
    );
    await serviceServices.alterFavorite(
      hashIdUtil.hashIdDecode(serviceId),
      req.auth.id,
      "add",
    );
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
}
export async function removeFromFavorite(req, res, next) {
  try {
    const { id: serviceId } = req.params;
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["client"],
      false,
    );
    await serviceServices.alterFavorite(
      hashIdUtil.hashIdDecode(serviceId),
      req.auth.id,
      "remove",
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export async function getClientServices(req, res, next) {
  try {
    const services = await serviceServices.getClientServices(req.auth.id);
    const sanitizedServicesWithTimelines = services.map((i) => {
      const ts = i.toJSON();
      const temp = {
        ...ts,
        id: hashIdUtil.hashIdEncode(ts.id),
        timelines: ts.Orders.map((t) => {
          return {
            orderId: hashIdUtil.hashIdEncode(t.id),
            timelineId: hashIdUtil.hashIdEncode(t.Timeline.id),
            timelineLabel: t.Timeline.label,
          };
        }),
      };
      delete temp.Orders;
      return temp;
    });
    res.send(sanitizedServicesWithTimelines);
  } catch (error) {
    next(error);
  }
}
export async function requestApproval(req, res, next) {
  try {
    const { id } = req.params;
    await authUtils.checkRoleAndPermission(
      req.auth,
      ["service_provider_rep", "service_provider_root"],
      false,
    );
    await serviceServices.requestApproval(
      hashIdUtil.hashIdDecode(id),
      req.auth.relatedId,
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
const serviceController = {
  pauseResumeService,
  alterServiceStatus,
  restoreService,
  updateService,
  getServiceProfile,
  getAllServicesAdmin,
  getAllServicesSP,
  getAllServices,
  createService,
  requestApproval,
  getServiceProfileForAdminAndSP,
  addToFavorite,
  removeFromFavorite,
  getClientServices,
};
export default serviceController;
