// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import isUserAdminInGroupFn from "../../../group/utils/isUserAdminInGroup";
import isUserAdminInPageFn from "../../../page/utils/isUserAdminInPage";
import handleConnectDB from "@/lib/handleConnectDB";

// models
import Post from "../../../../_models/post.model";

// types
import type { APIContextFnType, ImageType, PostType } from "@/lib/types";

const editPost = async (
  _: unknown,
  {
    newPostData: { postId, ...postData },
  }: {
    newPostData: Pick<
      PostType,
      "caption" | "media" | "privacy" | "blockComments"
    > & {
      postId: string;
    };
  },
  { req }: APIContextFnType
) => {
  if (!postId) {
    throw new GraphQLError("post id must be provided", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  if (
    !postData.caption &&
    !postData.media &&
    !postData.privacy &&
    !("blockComments" in postData)
  ) {
    throw new GraphQLError("you must provide new data to update the post", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  if (
    "privacy" in postData &&
    !["friends_only", "public", "only_me"].includes(postData.privacy)
  ) {
    throw new GraphQLError(
      "privacy must be on of this values only [public, only_me, friends_only]",
      { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
    );
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while edit the post",
    async resolveCallback(user) {
      const oldPost = (
        await Post.findById(postId).populate({
          path: "communityId",
          select: "_id owner",
        })
      )._doc;

      if (!oldPost) {
        throw new GraphQLError("post with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (
        oldPost.community === "personal" &&
        user._id.toString() !== oldPost.owner.toString()
      ) {
        throw new GraphQLError("post owner only can modify the post", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      if (oldPost.community !== "personal") {
        const communityData = oldPost.communityId?._doc;

        if (!communityData) {
          throw new GraphQLError("page info not found", {
            extensions: {
              code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
            },
          });
        }

        const isUserAdminInCommunity = await (oldPost.community === "page"
          ? isUserAdminInPageFn
          : isUserAdminInGroupFn)(user._id, communityData._id);

        const hasAccess =
          user._id !== communityData.owner.toString() ||
          !isUserAdminInCommunity;

        if (!hasAccess) {
          throw new GraphQLError(
            `you don't have access to edit posts in this ${oldPost.community}`,
            {
              extensions: { code: "FORBIDDEN" },
            }
          );
        }
      }

      const newDataKeys = Object.keys(postData).filter(
        (key) => key !== "media"
      );

      for (let i = 0; i < newDataKeys.length; i++) {
        if (
          newDataKeys[i] in postData &&
          oldPost[newDataKeys[i]] ===
            postData[newDataKeys[i] as keyof typeof postData]
        ) {
          throw new GraphQLError(`${newDataKeys[i]} can't be the same value`, {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          });
        }
      }

      const pushNewMedia: { $push?: { media: ImageType[] } } = {};

      if (postData.media?.length) {
        pushNewMedia.$push = { media: postData.media };
      }

      await Post.updateOne(
        { _id: postId },
        {
          $set: JSON.parse(
            JSON.stringify(postData, ["caption", "privacy", "blockComments"])
          ),
          ...pushNewMedia,
        },
        { new: true }
      );

      return { message: "post updated successfully" };
    },
  });
};

export default editPost;
