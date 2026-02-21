import hashIdUtil from "../../utils/hashId.util.js";
import categoryRepository from "../category/category.repository.js";
import metaRepository from "./notification.repository.js";

export const initCall = async () => {
  const allCat = await categoryRepository.getAllCategories();
  const categories = allCat.map((i) => ({
    title: i.title,
    label: i.label,
    id: hashIdUtil.hashIdEncode(i.id),
    subcategories:
      i.Subcategories &&
      i.Subcategories.map((sc) => ({
        title: sc.title,
        label: sc.label,
        id: hashIdUtil.hashIdEncode(sc.id),
      })),
  }));
  return { categories };
};

const metaServices = { initCall };

export default metaServices;
