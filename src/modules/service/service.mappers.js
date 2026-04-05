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
      limit,
      deadlineDate,
      maxParticipants,
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
        deadlineDate,
        maxParticipants,
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
  const formatted = variants.map(({ id, label, price, deliveryTime }) => {
    const numericPrice = parseFloat(price);
    if (numericPrice < minPrice) minPrice = numericPrice;
    if (numericPrice > maxPrice) maxPrice = numericPrice;
    return {
      id: encodeId(id),
      label,
      price: numericPrice,
      deliveryTime,
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
      category: hashIdUtil.hashIdEncode(service.Subcategory.Category.id),
      subCategory: hashIdUtil.hashIdEncode(service.Subcategory.id),
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
            deadlineDate,
            maxParticipants,
          }) => ({
            id: encodeId(id),
            serviceId: encodeId(serviceId),
            label,
            price: parseFloat(price),
            startDate,
            endDate,
            isArchived,
            deadlineDate,
            maxParticipants,
          }),
        ) ?? [])
      : undefined;

  const variants =
    service.type === "oneTime"
      ? (service.variants?.map(
          ({ id, serviceId, label, price, deliveryTime }) => ({
            id: encodeId(id),
            serviceId: encodeId(serviceId),
            label,
            deliveryTime,
            price: parseFloat(price),
          }),
        ) ?? [])
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
    requirements: service.requirements,
    /* -------- relations -------- */
    category: {
      id: encodeId(service.Subcategory.Category.id),
      title: service.Subcategory.Category.title,
      label: service.Subcategory.Category.label,
    },
    subCategory: {
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
