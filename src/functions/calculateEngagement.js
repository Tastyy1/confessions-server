exports = async function () {
  const Post = context.services
    .get("<CLUSTER_NAME>")
    .db("<DB_NAME>")
    .collection("<COLLECTION_NAME>");
  const Comment = context.services
    .get("<CLUSTER_NAME>")
    .db("<DB_NAME>")
    .collection("<COLLECTION_NAME>");

  const LIKE_VALUE = 1.25;
  const DISLIKE_VALUE = -0.5;
  const COMMENT_VALUE = 2.0;
  const REPLY_VALUE = 2.0;
  const REPORT_VALUE = -0.125;

  try {
    const bulkOpsPosts = [];
    const bulkOpsComments = [];

    const updateEngagement = (doc, value) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: { engagement: value },
          $currentDate: { updatedAt: true },
        },
      },
    });

    const processPosts = async (posts) => {
      for (const post of posts) {
        const engagement =
          post.count.likes * LIKE_VALUE +
          post.count.dislikes * DISLIKE_VALUE +
          post.count.comments * COMMENT_VALUE +
          post.meta.reports * REPORT_VALUE;

        bulkOpsPosts.push(updateEngagement(post, engagement));
      }
    };

    const processComments = async (comments) => {
      for (const comment of comments) {
        const engagement =
          comment.count.likes * LIKE_VALUE +
          comment.count.dislikes * DISLIKE_VALUE +
          comment.count.replies * REPLY_VALUE +
          comment.meta.reports * REPORT_VALUE;

        bulkOpsComments.push(updateEngagement(comment, engagement));
      }
    };

    const posts = await Post.find(
      { "meta.isDeleted": false },
      { count: 1, "meta.reports": 1 }
    ).toArray();

    const comments = await Comment.find(
      { "meta.isDeleted": false },
      { count: 1, "meta.reports": 1 }
    ).toArray();

    await Promise.all([processPosts(posts), processComments(comments)]);

    if (bulkOpsPosts.length > 0) {
      await Post.bulkWrite(bulkOpsPosts);
    }

    if (bulkOpsComments.length > 0) {
      await Comment.bulkWrite(bulkOpsComments);
    }
  } catch (err) {
    console.error(err);
  }
};
