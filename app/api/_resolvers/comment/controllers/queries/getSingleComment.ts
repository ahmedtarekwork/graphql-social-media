// utils
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { GraphQLError } from "graphql";

// models
import Comment from "../../../../_models/comment.model";

const getSingleComment = async (
  _: unknown,
  { commentId }: { commentId: string }
) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting the comment",
    async resolveCallback() {
      const comment = await Comment.findById(commentId)
        .populate({ path: "owner", select: "_id username profilePicture" })
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
        });

      if (!comment) {
        throw new GraphQLError("comment with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return comment;
    },
  });
};

export default getSingleComment;
