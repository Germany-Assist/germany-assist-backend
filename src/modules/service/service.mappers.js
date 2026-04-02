import { generateDownloadUrl } from "../../configs/s3Configs.js";
import hashIdUtil from "../../utils/hashId.util.js";

/* ----------------------------- helpers ----------------------------- */

const encodeId = (id) => hashIdUtil.hashIdEncode(id);

const resolveImageUrl = async (url) => {
  return url ? await generateDownloadUrl(url) : undefined;
};

const timelinesFormatter = (timelines) => {
  if (!timelines || timelines.length < 1) return undefined;
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  const formatted = timelines.map(
    ({
      id,
      serviceId,
      label,
      price,
      startDate,
      endDate,
      isArchived,
      limit,
      deadlineDate,
    }) => {
      const numericPrice = parseFloat(price);
      if (numericPrice < minPrice) minPrice = numericPrice;
      if (numericPrice > maxPrice) maxPrice = numericPrice;
      return {
        id: encodeId(id),
        serviceId: encodeId(serviceId),
        label,
        price: numericPrice,
        startDate,
        endDate,
        isArchived,
        deadlineDate,
        limit,
      };
    },
  );
  return {
    timelines: formatted,
    minPrice,
    maxPrice,
  };
};

const variantsFormatter = (variants) => {
  if (!variants || variants.length < 1) return undefined;
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  const formatted = variants.map(({ id, label, price, isArchived, limit }) => {
    const numericPrice = parseFloat(price);
    if (numericPrice < minPrice) minPrice = numericPrice;
    if (numericPrice > maxPrice) maxPrice = numericPrice;
    return {
      id: encodeId(id),
      label,
      price: numericPrice,
      isArchived,
      limit,
    };
  });
  return {
    variants: formatted,
    minPrice,
    maxPrice,
  };
};
/* ------------------------ services list ------------------------ */

export const sanitizeServices = async (services = []) => {
  return await Promise.all(
    services.map(async (service) => ({
      id: encodeId(service.id),
      title: service.title,
      description: service.description,
      type: service.type,
      views: service.views,
      rating: service.rating,
      totalReviews: service.totalReviews,
      type: service.type,
      isPaused: service.isPaused,
      rejectionReason: service.rejectionReason,
      category: service.Subcategory.title,
      serviceProvider: service.ServiceProvider.name,
      image: await resolveImageUrl(service.image[0]?.url),
      timelines: timelinesFormatter(service.timelines),
      variants: variantsFormatter(service.variants),
      status: service.status,
      isPaused: service.isPaused,
    })),
  );
};

/* ---------------------- service profile ---------------------- */

export const sanitizeServiceProfile = async (service) => {
  if (!service) return null;

  const assets = await Promise.all(
    (service.Assets ?? []).map(
      async ({ mediaType, key, confirmed, name, thumb, url }) => ({
        mediaType,
        key,
        confirmed,
        name,
        thumb,
        url: await resolveImageUrl(url),
      }),
    ),
  );

  const timelines =
    service.type === "timeline"
      ? (service.timelines?.map(
          ({
            id,
            serviceId,
            label,
            price,
            startDate,
            endDate,
            isArchived,
          }) => ({
            id: encodeId(id),
            serviceId: encodeId(serviceId),
            label,
            price: parseFloat(price),
            startDate,
            endDate,
            isArchived,
          }),
        ) ?? [])
      : undefined;

  const variants =
    service.type === "oneTime"
      ? (service.variants?.map(({ id, serviceId, label, price }) => ({
          id: encodeId(id),
          serviceId: encodeId(serviceId),
          label,
          price: parseFloat(price),
        })) ?? [])
      : undefined;

  return {
    /* -------- core -------- */
    id: encodeId(service.id),
    title: service.title,
    description: service.description,
    type: service.type,
    views: service.views,
    rating: service.rating,
    totalReviews: service.totalReviews,
    isPaused: service.isPaused,
    rejectionReason: service.rejectionReason,
    /* -------- relations -------- */
    category: {
      id: encodeId(service.Subcategory.id),
      title: service.Subcategory.title,
      label: service.Subcategory.label,
    },

    serviceProvider: {
      id: service.ServiceProvider.id,
      name: service.ServiceProvider.name,
      isVerified: service.ServiceProvider.isVerified,
    },

    /* -------- options -------- */
    ...(timelines && { timelines }),
    ...(variants && { variants }),

    /* -------- reviews -------- */
    reviews:
      service.Reviews?.map((r) => ({
        body: r.body,
        rating: r.rating,
        user: {
          id: encodeId(r.user.id),
          name: `${r.user.firstName} ${r.user.lastName}`,
        },
      })) ?? [],

    /* -------- assets -------- */
    assets,
  };
};

/* ---------------------------- export ---------------------------- */

export default {
  sanitizeServices,
  sanitizeServiceProfile,
};
