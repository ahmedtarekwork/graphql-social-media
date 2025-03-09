// utils
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Comment from "../../../../_models/comment.model";

// types
import type { CommentType, Pagination } from "@/lib/types";

const getPostComments = async (
  _: unknown,
  {
    commentData: { postId, page = 1, limit = 0, skip = 0 },
  }: { commentData: Pagination<{ postId: string; skip: number }> }
) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting comments",
    async resolveCallback() {
      const mainSkip = limit * (page - 1);
      const commentsPromise = Comment.find({ post: postId })
        .lean()
        .select({
          "reactions.like.count": 1,
          "reactions.love.count": 1,
          "reactions.sad.count": 1,
          "reactions.angry.count": 1,
          comment: 1,
          media: 1,
          privacy: 1,
          community: 1,
          createdAt: 1,
        })
        .sort("-createdAt")
        .populate({ path: "owner", select: "_id username profilePicture" })
        .limit(limit)
        .skip(mainSkip + skip);

      const commentsCountPromise = Comment.countDocuments({ post: postId });

      const [comments, commentsCount] = await Promise.allSettled([
        commentsPromise,
        commentsCountPromise,
      ]);

      if ([comments, commentsCount].some((res) => res.status === "rejected")) {
        throw new GraphQLError("can't get this post comments at the momment", {
          extensions: {
            code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
          },
        });
      }

      return {
        comments:
          (comments as unknown as { value: CommentType[] })?.value || [],
        isFinalPage:
          page * limit >= ((commentsCount as { value: number })?.value || 0),
      };
    },
  });
};

export default getPostComments;
