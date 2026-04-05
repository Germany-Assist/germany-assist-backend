import db from "../../database/index.js";

async function archiveVariant(providerId, variantId, status) {
  const update = await db.Variant.findOne({
    where: { id: variantId },
    include: [
      {
        model: db.Service,
        where: { serviceProviderId: providerId },
        required: true,
      },
    ],
  });
  if (!update) return null;
  update.isArchived = status;
  await update.save();
  return update;
}
async function authorizeVariantCreation(providerId, serviceId) {
  return await db.Service.findOne({
    raw: true,
    where: { serviceProviderId: providerId, id: serviceId },
  });
}
async function createNewVariant(data) {
  const newVariant = await db.Variant.create(data);
  return newVariant;
}
async function deleteVariants(options) {
  return await db.Variant.destroy(options);
}
async function bulkCreateVariants(data, transaction) {
  await db.Variant.bulkCreate(data, { transaction });
}
const VariantRepository = {
  deleteVariants,
  archiveVariant,
  createNewVariant,
  bulkCreateVariants,
  authorizeVariantCreation,
};
export default VariantRepository;
