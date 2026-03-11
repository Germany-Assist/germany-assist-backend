import hashIdUtil from "../../utils/hashId.util.js";

async function formatPost(post) {
  let assets = [];
  if (post.Assets && post.Assets.length > 0) {
    assets = await Promise.all(
      post.Assets.map(async (i) => {
        return { ...i, url: await generateDownloadUrl(i.url) };
      }),
    );
  }
  return {
    id: hashIdUtil.hashIdEncode(post.id),
    description: post.description,
    assets,
    commentsCount: post.commentsCount,
  };
}

async function sanitizeTimeline(timeline) {
  return {
    id: hashIdUtil.hashIdEncode(timeline.id),
    posts: await Promise.all(timeline.Posts?.map(formatPost)),
  };
}
const timelineMappers = { sanitizeTimeline };
export default timelineMappers;
