// types
import type { APIContextFnType } from "@/lib/types";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Post from "../../../../_models/post.model";

const deleteMediaFromPost = async (
  _: unknown,
  {
    mediaData: { itemId: postId, publicIds },
  }: { mediaData: { itemId: string; publicIds: string[] } },
  { req }: APIContextFnType
) => {
  if (!postId) {
    throw new GraphQLError("post id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (!publicIds?.length) {
    throw new GraphQLError("you must select some media to delete it", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while delete media from post",
    async resolveCallback(user) {
      const oldPost = (await Post.findById(postId))?._doc;

      if (!oldPost) {
        throw new GraphQLError("post with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (oldPost.owner.toString() !== user._id) {
        throw new GraphQLError("you aren't the post owner", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      await deleteMedia(publicIds);

      await Post.updateOne(
        { _id: postId },
        {
          $pull: {
            media: {
              $or: publicIds.map((id) => ({ public_id: id })),
            },
          },
        }
      );

      return { message: "media deleted successfully" };
    },
  });
};

export default deleteMediaFromPost;
