// utils
import checkForPostPrivacy from "@/lib/checkForPostPrivacy";
import handleConnectDB from "@/lib/handleConnectDB";

import type { APIContextFnType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Post from "../../../../_models/post.model";
import User from "../../../../_models/user.model";

const togglePostFromBookmark = async (
  _: unknown,
  { postId }: { postId: string },
  { req }: APIContextFnType
) => {
  if (!postId) {
    throw new GraphQLError("post id must be provided", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  return await handleConnectDB({
    publicErrorMsg: "something went wrong while saving the post",
    req,
    validateToken: true,
    async resolveCallback(user) {
      const post = await checkForPostPrivacy(postId, user._id);
      if (post instanceof GraphQLError) throw post;

      const isPostExistsInUserBookmark = !!post.isInBookMark;

      await User.updateOne(
        { _id: user._id },
        {
          [`$${isPostExistsInUserBookmark ? "pull" : "push"}`]: {
            savedPosts: postId,
          },
        }
      );

      await Post.updateOne(
        { _id: postId },
        {
          $set: {
            isInBookMark: !isPostExistsInUserBookmark,
          },
        }
      );

      return {
        message: `post ${
          isPostExistsInUserBookmark ? "removed from you bookmarks" : "saved"
        } successfully`,
      };
    },
  });
};

export default togglePostFromBookmark;
