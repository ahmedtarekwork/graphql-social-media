// utils
import { checkForPrivacy } from "@/lib/checkForPostPrivacy";
import handleConnectDB from "@/lib/handleConnectDB";

// types
import type { APIContextFnType, ImageType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Comment from "../../../../_models/comment.model";

const editComment = async (
  _: unknown,
  {
    editCommentData: { commentId, comment, media },
  }: {
    editCommentData: {
      commentId: string;
      comment?: string;
      media?: ImageType[];
    };
  },
  { req }: APIContextFnType
) => {
  if (!commentId) {
    throw new GraphQLError("comment id is required to update it", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (!comment && !media?.length) {
    throw new GraphQLError("you must provide some data to update the comment", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    publicErrorMsg: "something went wrong while update the comment",
    validateToken: true,
    req,
    async resolveCallback(user) {
      const oldComment = await Comment.findById(commentId).populate("post");

      if (!oldComment) {
        throw new GraphQLError("comment with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (!oldComment.post) {
        throw new GraphQLError("post was deleted", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const privacyChecker = checkForPrivacy(oldComment.post, user._id);
      if (privacyChecker instanceof GraphQLError) throw privacyChecker;

      if (oldComment.owner.toString() !== user._id) {
        throw new GraphQLError("you can't edit other users comments");
      }

      const updatedData = {} as Record<string, unknown>;

      if (comment) {
        if (oldComment.comment === comment && !media?.length) {
          throw new GraphQLError("you can't update comment with same", {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          });
        }

        if (oldComment.comment !== comment) {
          updatedData.$set = {
            comment,
          };
        }
      }

      if (media?.length) {
        updatedData.$push = {
          media,
        };
      }

      await Comment.updateOne({ _id: commentId }, updatedData);

      return { message: "comment updated successfully" };
    },
  });
};

export default editComment;
