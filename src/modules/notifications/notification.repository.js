import db from "../../database/index.js";
export const initCall = async () => {
  const categories = await db.Category.findAll({
    raw: true,
    attributes: ["id", "title", "label"],
  });
  return categories;
};

const metaRepository = { initCall };
export default metaRepository;
