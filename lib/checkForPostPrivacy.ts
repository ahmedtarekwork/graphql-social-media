// graphql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Post from "@/app/api/_models/post.model";
import User from "@/app/api/_models/user.model";

// types
import type { PostType } from "./types";

// utils
import { Types } from "mongoose";

export const checkForPrivacy = async (
  post: Pick<PostType, "_id" | "privacy" | "owner">,
  userId: string
): Promise<boolean | GraphQLError> => {
  const postOwnerId = new Types.ObjectId(post.owner._id);

  const isUserInPostOwnerFriends = await User.aggregate([
    { $match: { _id: postOwnerId } },
    {
      $project: {
        isUserInPostOwnerFriends: {
          $in: [new Types.ObjectId(userId), "$friendsList"],
        },
      },
    },
    { $match: { isUserInPostOwnerFriends: true } },
  ]);

  const notFriendReason =
    post.privacy === "friends_only" &&
    !isUserInPostOwnerFriends?.[0]?.isUserInPostOwnerFriends;

  const notPublicReason =
    post.privacy === "only_me" && post.owner._id.toString() !== userId;

  if (notFriendReason || notPublicReason) {
    throw new GraphQLError(
      `this post is available to ${
        notFriendReason ? "friends of " : ""
      }post owner only`,
      { extensions: { code: "FORBIDDEN" } }
    );
  }

  return true;
};

const checkForPostPrivacy = async (
  postId: string,
  userId: string
): Promise<PostType> => {
  if (!postId) {
    throw new GraphQLError("post id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  const post = (await Post.findById(postId)
    .populate({
      path: "owner",
      select: "_id username profilePicture",
    })
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
      createdAt: 1,
    })) as PostType;

  if (!post) {
    throw new GraphQLError("post not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const privacyCheck = await checkForPrivacy(post, userId);
  if (privacyCheck instanceof GraphQLError) throw privacyCheck;

  return post;
};

export default checkForPostPrivacy;
