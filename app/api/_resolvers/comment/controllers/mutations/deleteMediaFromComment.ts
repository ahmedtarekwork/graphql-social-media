// utils
import { checkForPrivacy } from "@/lib/checkForPostPrivacy";
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Comment from "../../../../_models/comment.model";

// types
import type { APIContextFnType } from "@/lib/types";

const deleteMediaFromComment = async (
  _: unknown,
  {
    mediaData: { itemId: commentId, publicIds },
  }: { mediaData: { itemId: string; publicIds: string[] } },
  { req }: APIContextFnType
) => {
  if (!commentId) {
    throw new GraphQLError("comment id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (!publicIds?.length) {
    throw new GraphQLError("you need to select some media to delete", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while delete media from comment",
    async resolveCallback(user) {
      const oldComment = (await Comment.findById(commentId).populate("post"))
        ?._doc;

      if (!commentId) {
        throw new GraphQLError("comment with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const privacyChecker = checkForPrivacy(oldComment.post._doc, user._id);
      if (privacyChecker instanceof GraphQLError) throw privacyChecker;

      if (oldComment.owner.toString() !== user._id) {
        throw new GraphQLError("you can't delete other users comments");
      }

      await Promise.allSettled([
        deleteMedia(publicIds),

        Comment.updateOne(
          { _id: commentId },
          {
            $pull: {
              media: {
                $or: publicIds.map((id) => ({ public_id: id })),
              },
            },
          }
        ),
      ]);

      return { message: "media deleted successfully from the comment" };
    },
  });
};

export default deleteMediaFromComment;
