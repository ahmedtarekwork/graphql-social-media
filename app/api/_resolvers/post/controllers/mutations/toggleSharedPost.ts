// types
import type { APIContextFnType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import checkForPostPrivacy from "@/lib/checkForPostPrivacy";
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import Post from "../../../../_models/post.model";
import User from "../../../../_models/user.model";

const toggleSharedPost = async (
  _: unknown,
  { postId }: { postId: string },
  { req }: APIContextFnType
) => {
  if (!postId) {
    throw new GraphQLError("post id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while proccess your order",
    async resolveCallback(user) {
      const post = await checkForPostPrivacy(postId, user._id);
      if (post instanceof GraphQLError) throw post;

      const isPostInMyPostsResponse = await User.aggregate([
        { $match: { _id: new Types.ObjectId(user._id) } },
        {
          $project: {
            isPostInMyPosts: {
              $in: [new Types.ObjectId(postId), "$allPosts.post"],
            },
          },
        },
      ]);

      const isPostInMyPosts = isPostInMyPostsResponse?.[0]?.isPostInMyPosts;

      const finalSharedPostData = {
        post: postId,
      } as Record<string, unknown>;

      if (!isPostInMyPosts) {
        finalSharedPostData.shareDate = Date.now();
      }

      await User.updateOne(
        { _id: user._id },
        {
          [`$${isPostInMyPosts ? "pull" : "push"}`]: {
            allPosts: finalSharedPostData,
            sharedPosts: postId,
          },
        }
      );

      await Post.updateOne(
        { _id: postId },
        {
          $inc: {
            "shareData.count": isPostInMyPosts ? -1 : 1,
          },
          [`$${isPostInMyPosts ? "pull" : "push"}`]: {
            "shareData.users": user._id,
          },
        }
      );

      if (!isPostInMyPosts) {
        const notification = {
          content: `${user.username} shared your post`,
          icon: "post",
          url: `/post/${postId}`,
        };

        await User.updateOne(
          { _id: post.owner._id },
          {
            $push: { notifications: notification },
          }
        );
      }

      return {
        message: `post ${
          isPostInMyPosts ? "removed from" : "add to"
        } your shared posts successfully`,
      };
    },
  });
};

export default toggleSharedPost;
