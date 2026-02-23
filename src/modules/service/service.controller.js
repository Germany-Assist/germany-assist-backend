import serviceServices from "./service.services.js";
import hashIdUtil from "../../utils/hashId.util.js";
import authUtils from "../../utils/authorize.util.js";
import { sequelize } from "../../configs/database.js";
import { AppError } from "../../utils/error.class.js";
import serviceMappers from "./service.mappers.js";
import notificationQueue from "../../jobs/queues/notification.queue.js";
import { NOTIFICATION_EVENTS } from "../../configs/constants.js";

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
  try {
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["admin", "service_provider_root", "service_provider_rep", "super_admin"],
      true,
      "service",
      "update",
    );
    const owner = await authUtils.checkOwnership(
      req.body.id,
      req.auth.relatedId,
      "Service",
    );
    const allowedFields = ["description"];
    let updateFields = {};
    allowedFields.forEach((i) => {
      if (req.body[i]) updateFields[i] = req.body[i];
    });
    await serviceServices.updateService(
      hashIdUtil.hashIdDecode(req.body.id),
      updateFields,
    );
    res.send({ success: true, message: "Service Updated" });
  } catch (error) {
    next(error);
  }
}
export async function deleteService(req, res, next) {
  try {
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["admin", "service_provider_root", "super_admin"],
      true,
      "service",
      "delete",
    );
    const owner = await authUtils.checkOwnership(
      req.params.id,
      req.auth.relatedId,
      "Service",
    );
    await serviceServices.deleteService(hashIdUtil.hashIdDecode(req.params.id));
    res.send({ success: true, message: "Service Deleted Successfully" });
  } catch (error) {
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
    const { status, id } = req.body;
    await serviceServices.alterServiceStatus(
      hashIdUtil.hashIdDecode(id),
      status,
    );

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
//TODO delete this
export async function alterServiceStatusSP(req, res, next) {
  try {
    const { status, id } = req.body;
    if (!["publish", "unpublish"].includes(status)) {
      throw new AppError(422, "invalid status", true, "invalid status");
    }
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["service_provider_rep", "service_provider_root"],
      true,
      "service",
      status,
    );
    await serviceServices.alterServiceStatusSP(
      hashIdUtil.hashIdDecode(id),
      status,
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export async function publishService(req, res, next) {
  try {
    const { serviceId } = req.params;
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["service_provider_rep", "service_provider_root"],
      true,
      "service",
      "publish",
    );
    await serviceServices.alterServiceStatusSP(
      hashIdUtil.hashIdDecode(serviceId),
      "publish",
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
export async function unpublishService(req, res, next) {
  try {
    const { serviceId } = req.params;
    const user = await authUtils.checkRoleAndPermission(
      req.auth,
      ["service_provider_rep", "service_provider_root"],
      true,
      "service",
      "unpublish",
    );
    await serviceServices.alterServiceStatusSP(
      hashIdUtil.hashIdDecode(serviceId),
      "unpublish",
    );
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
const serviceController = {
  alterServiceStatusSP,
  alterServiceStatus,
  restoreService,
  deleteService,
  updateService,
  getServiceProfile,
  getAllServicesAdmin,
  getAllServicesSP,
  getAllServices,
  createService,
  getServiceProfileForAdminAndSP,
  addToFavorite,
  removeFromFavorite,
  getClientServices,
  unpublishService,
  publishService,
};
export default serviceController;
