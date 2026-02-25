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
    const id = req.auth.relatedId ? req.auth.relatedId : req.auth.id;
    const notificationId = req.params.id;
    const userType = req.auth.role;
    await notificationServices.updateRead({
      recipientId: id,
      userType,
      notificationId,
    });
    res.status(200).json({ message: "Notification updated successfully" });
  } catch (error) {
    next(error);
  }
};
const notificationController = { getAll, updateRead };

export default notificationController;
