// gql
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import User from "../../../../_models/user.model";
import Post from "../../../../_models/post.model";

// types
import type { APIContextFnType, PostType } from "@/lib/types";

const getSinglePost = async (
  _: unknown,
  { postId }: { postId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    publicErrorMsg: "something went wrong while getting the post",
    async resolveCallback(user) {
      const post = (await Post.findById(postId)
        .populate([
          {
            path: "owner",
            select: "username _id profilePicture",
          },
          {
            path: "communityId",
            select: "profilePicture name _id owner",
          },
        ])
        .lean()
        .select({
          "shareData.count": 1,
          "reactions.like.count": 1,
          "reactions.love.count": 1,
          "reactions.sad.count": 1,
          "reactions.angry.count": 1,
          caption: 1,
          commentsCount: 1,
          blockComments: 1,
          media: 1,
          privacy: 1,
          community: 1,
          communityId: 1,
          createdAt: 1,
        })) as PostType;

      if (!post) {
        throw new GraphQLError("This post not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      switch (post.privacy) {
        case "friends_only": {
          const isPostOwnerMyFriendRequest = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user?._id) } },
            {
              $project: {
                isPostOwnerMyFriend: {
                  $in: [
                    new Types.ObjectId(post.owner as unknown as string),
                    "$friendsList",
                  ],
                },
              },
            },
            { $match: { isPostOwnerMyFriend: true } },
          ]);

          if (
            !isPostOwnerMyFriendRequest?.[0]?.isPostOwnerMyFriend &&
            post.owner.toString() !== user?._id
          ) {
            throw new GraphQLError(
              "this post available to post owner friends only",
              { extensions: { code: "FORBIDDEN" } }
            );
          }
        }
        case "only_me": {
          if (user?._id !== post.owner.toString()) {
            throw new GraphQLError("this post available for post owner only", {
              extensions: { code: "FORBIDDEN" },
            });
          }
        }
      }

      const result = user?._id
        ? await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                isShared: [
                  {
                    $project: {
                      isShared: {
                        $in: [new Types.ObjectId(postId), "$sharedPosts"],
                      },
                    },
                  },
                  { $match: { isShared: true } },
                ],
                isInBookMark: [
                  {
                    $project: {
                      isInBookMark: {
                        $in: [new Types.ObjectId(postId), "$savedPosts"],
                      },
                    },
                  },
                  { $match: { isInBookMark: true } },
                ],
              },
            },
          ])
        : undefined;

      return {
        ...post,
        isShared: !!result?.[0]?.isShared?.[0]?.isShared,
        isInBookMark: !!result?.[0]?.isInBookMark?.[0]?.isInBookMark,
        shareDate: (post as unknown as { createdAt: string }).createdAt,
        communityInfo: post.communityId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        communityId: (post.communityId as any)?._id,
      };
    },
  });
};

export default getSinglePost;
