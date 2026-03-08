import notificationServices from "./notification.services.js";

export const getAll = async (req, res, next) => {
  try {
    const id = req.auth.relatedId ? req.auth.relatedId : req.auth.id;
    const userType = req.auth.role;
    const data = await notificationServices.getAll(id, userType, req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
export const updateRead = async (req, res, next) => {
  try {
    const recipientId = req.auth.relatedId ?? req.auth.id;
    const userType = req.auth.role;

    const { notificationIds, markAs = "read" } = req.body;

    await notificationServices.updateRead({
      recipientId,
      userType,
      notificationIds,
      markAs,
    });

    res.status(200).json({
      message: `Notification marked as ${markAs} successfully`,
    });
  } catch (error) {
    next(error);
  }
};
export const markAllAsRead = async (req, res, next) => {
  try {
    const id = req.auth.relatedId ? req.auth.relatedId : req.auth.id;
    const userType = req.auth.role;
    await notificationServices.updateRead({
      recipientId: id,
      userType,
      all: true,
    });
    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
const notificationController = { getAll, updateRead, markAllAsRead };

export default notificationController;
