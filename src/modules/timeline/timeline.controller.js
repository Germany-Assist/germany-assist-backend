import timelineServices from "./timeline.service.js";
import authUtil from "../../utils/authorize.util.js";
import { AppError } from "../../utils/error.class.js";
import hashIdUtil from "../../utils/hashId.util.js";

async function getTimelineByIdForClient(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["client"]);
    const id = hashIdUtil.hashIdDecode(req.params.id);
    const page = req.query.page || 0;
    const { sanitizedPosts, sanitizedPinnedPosts } =
      await timelineServices.getTimelineForClient(req.auth.id, id, page);
    if (!sanitizedPosts) {
      throw new AppError(
        404,
        "failed to find timeline",
        true,
        "failed to find timeline",
      );
    }
    res.send({
      success: true,
      posts: sanitizedPosts,
      pinnedPosts: sanitizedPinnedPosts,
    });
  } catch (error) {
    next(error);
  }
}

async function viewTimelineProvider(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["service_provider_root"]);
    const id = hashIdUtil.hashIdDecode(req.params.id);
    const page = req.query.page || 0;
    const { sanitizedPosts, sanitizedPinnedPosts } =
      await timelineServices.viewTimelineProvider(req.auth.relatedId, id, page);
    if (!sanitizedPosts) {
      throw new AppError(
        404,
        "failed to find timeline",
        true,
        "failed to find timeline",
      );
    }
    res.send({
      success: true,
      posts: sanitizedPosts,
      pinnedPosts: sanitizedPinnedPosts,
    });
  } catch (error) {
    next(error);
  }
}
async function archiveTimeline(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["service_provider_root"]);
    const id = hashIdUtil.hashIdDecode(req.params.id);
    await timelineServices.archiveTimeline(req.auth.relatedId, id);
    res.send({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

async function createNewTimeline(req, res, next) {
  try {
    await authUtil.checkRoleAndPermission(req.auth, ["service_provider_root"]);
    await timelineServices.createNewTimeline(req.auth.relatedId, req.body);
    res.status(201).send({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

const timelineController = {
  getTimelineByIdForClient,
  archiveTimeline,
  createNewTimeline,
  viewTimelineProvider,
};
export default timelineController;
