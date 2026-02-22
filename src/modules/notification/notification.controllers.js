import notificationServices from "./notification.services.js";

export const getAll = async (req, res, next) => {
  try {
    const id = req.auth.relatedId ? req.auth.relatedId : req.auth.id;
    const { page, limit } = req.query;
    const data = await notificationServices.getAll(id, page, limit);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
export const updateRead = async (req, res, next) => {
  try {
    const id = req.auth.relatedId ? req.auth.relatedId : req.auth.id;
    const notificationId = req.params.id;
    await notificationServices.updateRead({ recipientId: id, notificationId });
    res.status(200).json({ message: "Notification updated successfully" });
  } catch (error) {
    next(error);
  }
};
const notificationController = { getAll, updateRead };

export default notificationController;
