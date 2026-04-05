import { Op, where } from "sequelize";
import db from "../../database/index.js";
import { AppError } from "../../utils/error.class.js";
async function getTimelineForProvider({
  relatedId,
  timelineId,
  pinned = false,
  page = 0,
}) {
  const where = {};
  if (pinned) where.isPinned = true;

  const timeline = await db.Timeline.findOne({
    attributes: ["id"],
    where: { id: timelineId },
    include: [
      {
        model: db.Post,
        attributes: ["id", "description"],
        where,
        limit: pinned ? 3 : 10,
        offset: pinned ? 0 : page * 10,
        include: [
          {
            model: db.Asset,
            attributes: ["url", "thumb", "key", "mediaType", "name"],
          },
        ],
        order: [["createdAt", "DESC"]],
      },
      {
        model: db.Service,
        attributes: [],
        required: true,
        where: { serviceProviderId: relatedId },
      },
    ],
  });

  if (!timeline)
    throw new AppError(
      404,
      "failed to find the timeline in your orders",
      true,
      "failed to find the timeline in your orders",
    );

  const timelineJson = timeline.toJSON();

  for (const post of timelineJson.Posts) {
    const count = await db.Comment.count({
      where: { postId: post.id },
    });
    post.commentsCount = count;
  }

  return timelineJson;
}
async function getTimelineForClient({
  userId,
  timelineId,
  pinned = false,
  page = 0,
}) {
  const where = {};
  if (pinned) where.isPinned = true;

  const timeline = await db.Timeline.findOne({
    attributes: ["id"],
    where: { id: timelineId },
    include: [
      {
        model: db.Post,
        attributes: ["id", "description"],
        where,
        limit: pinned ? 3 : 10,
        offset: pinned ? 0 : page * 10,
        include: [
          {
            model: db.Asset,
            attributes: ["url", "thumb", "key", "mediaType", "name"],
          },
        ],
        order: [["createdAt", "DESC"]],
      },
      {
        model: db.Order,
        attributes: [],
        as: "orders",
        required: true,
        where: {
          userId: userId,
          status: { [Op.or]: ["active", "pending_completion", "completed"] },
        },
      },
    ],
  });

  if (!timeline)
    throw new AppError(
      404,
      "failed to find the timeline in your orders",
      true,
      "failed to find the timeline in your orders",
    );

  const timelineJson = timeline.toJSON();

  for (const post of timelineJson.Posts) {
    const count = await db.Comment.count({
      where: { postId: post.id },
    });
    post.commentsCount = count;
  }

  return timelineJson;
}

async function archiveTimeline(providerId, timelineId, status) {
  const update = await db.Timeline.findOne({
    where: { id: timelineId },
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

async function authorizeTimelineCreation(providerId, serviceId) {
  return await db.Service.findOne({
    raw: true,
    where: { serviceProviderId: providerId, id: serviceId },
  });
}

async function createNewTimeline(data) {
  const newTimeline = await db.Timeline.create(data);
  return newTimeline;
}

async function deleteTimelines(options) {
  return await db.Timeline.destroy(options);
}
async function bulkCreateTimelines(timelines, transaction) {
  return await db.Timeline.bulkCreate(timelines, { transaction });
}
const timelineRepository = {
  deleteTimelines,
  getTimelineForClient,
  archiveTimeline,
  createNewTimeline,
  authorizeTimelineCreation,
  bulkCreateTimelines,
  getTimelineForProvider,
};
export default timelineRepository;
