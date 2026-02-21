import metaServices from "./notification.services.js";

export const initCall = async (req, res, next) => {
  try {
    const data = await metaServices.initCall();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const metaController = { initCall };

export default metaController;
