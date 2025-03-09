// utils
import { deleteMedia } from "@/lib/utils";
import { checkForPrivacy } from "@/lib/checkForPostPrivacy";
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Comment from "../../../../_models/comment.model";
import Post from "../../../../_models/post.model";

// types
import type { APIContextFnType, ImageType } from "@/lib/types";

const deleteComment = async (
  _: unknown,
  { commentId }: { commentId: string },
  { req }: APIContextFnType
) => {
  if (!commentId) {
    throw new GraphQLError("comment id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while deleting the comment",
    async resolveCallback(user) {
      const comment = (await Comment.findById(commentId).populate("post"))._doc;

      if (!comment) {
        throw new GraphQLError("comment with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const privacyChecker = checkForPrivacy(comment.post._doc, user._id);
      if (privacyChecker instanceof GraphQLError) throw privacyChecker;

      if (comment.owner.toString() !== user._id) {
        throw new GraphQLError("you can't delete other users comments");
      }

      await Comment.deleteOne({ _id: commentId });

      await Promise.allSettled([
        Post.updateOne(
          { _id: comment.post._doc._id },
          {
            $inc: { commentsCount: -1 },
          }
        ),
        deleteMedia(comment.media.map((media: ImageType) => media.public_id)),
      ]);

      return { message: "comment deleted successfully" };
    },
  });
};

export default deleteComment;
