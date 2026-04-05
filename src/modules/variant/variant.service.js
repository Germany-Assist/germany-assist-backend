import { AppError } from "../../utils/error.class.js";
import hashIdUtil from "../../utils/hashId.util.js";
import variantRepository from "./variant.repository.js";

async function archiveVariant(providerId, variantId) {
  const result = await variantRepository.archiveVariant(
    providerId,
    variantId,
    true,
  );
  if (!result)
    throw new AppError(
      404,
      "failed to archive Variant",
      false,
      "failed to archive Variant",
    );
  return result;
}
async function createNewVariant(providerId, body) {
  const { deliveryTime, label, price } = body;
  const serviceId = hashIdUtil.hashIdDecode(body.serviceId);
  const data = {
    deliveryTime,
    label,
    price,
    serviceId,
  };
  const authorize = await variantRepository.authorizeVariantCreation(
    providerId,
    serviceId,
  );

  if (!authorize)
    throw new AppError(
      403,
      "unauthorized attempt",
      false,
      "unauthorized attempt",
    );
  const result = await variantRepository.createNewVariant(data);

  if (!result)
    throw new AppError(
      404,
      "failed to create Variant",
      false,
      "failed to create Variant",
    );
  return result;
}
const VariantServices = {
  createNewVariant,
  archiveVariant,
};
export default VariantServices;
