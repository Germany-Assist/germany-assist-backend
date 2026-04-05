import { AppError } from "../../utils/error.class.js";
import hashIdUtil from "../../utils/hashId.util.js";
import timelineMappers from "./timeline.mappers.js";
import timelineRepository from "./timeline.repository.js";

async function viewTimelineProvider(relatedId, timelineId, page) {
  const postsData = await timelineRepository.getTimelineForProvider({
    relatedId,
    timelineId,
    page,
  });
  const sanitizedPosts = await timelineMappers.sanitizeTimeline(postsData);
  if (page > 0) {
    return {
      sanitizedPosts,
      sanitizedPinnedPosts: null,
    };
  }
  const pinnedData = await timelineRepository.getTimelineForProvider({
    relatedId,
    timelineId,
    pinned: true,
  });
  const sanitizedPinnedPosts =
    await timelineMappers.sanitizeTimeline(pinnedData);
  return { sanitizedPosts, sanitizedPinnedPosts };
}
async function getTimelineForClient(userId, timelineId, page) {
  const postsData = await timelineRepository.getTimelineForClient({
    userId,
    timelineId,
    page,
  });
  const sanitizedPosts = await timelineMappers.sanitizeTimeline(postsData);
  if (page > 0) {
    return {
      sanitizedPosts,
      sanitizedPinnedPosts: null,
    };
  }
  const pinnedData = await timelineRepository.getTimelineForClient({
    userId,
    timelineId,
    pinned: true,
  });
  const sanitizedPinnedPosts =
    await timelineMappers.sanitizeTimeline(pinnedData);
  return { sanitizedPosts, sanitizedPinnedPosts };
}
async function archiveTimeline(providerId, timelineId) {
  const result = await timelineRepository.archiveTimeline(
    providerId,
    timelineId,
    true,
  );
  if (!result)
    throw new AppError(
      404,
      "failed to archive timeline",
      false,
      "failed to archive timeline",
    );
  return result;
}
async function createNewTimeline(providerId, body) {
  const { startDate, endDate, deadlineDate, maxParticipants, label, price } =
    body;
  const serviceId = hashIdUtil.hashIdDecode(body.serviceId);
  const data = {
    startDate,
    endDate,
    deadlineDate,
    maxParticipants,
    label,
    price,
    serviceId,
  };
  const authorize = await timelineRepository.authorizeTimelineCreation(
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

  const result = await timelineRepository.createNewTimeline(data);

  if (!result)
    throw new AppError(
      404,
      "failed to create timeline",
      false,
      "failed to create timeline",
    );
  return result;
}
const timelineServices = {
  getTimelineForClient,
  viewTimelineProvider,
  createNewTimeline,
  archiveTimeline,
};
export default timelineServices;
