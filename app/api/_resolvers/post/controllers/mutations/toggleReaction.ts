// constants
import { flatReactions } from "@/constants/reactions";

// utils
import checkForPostPrivacy from "@/lib/checkForPostPrivacy";
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// types
import type { APIContextFnType, ReactionsType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Post from "../../../../_models/post.model";
import User from "../../../../_models/user.model";

const toggleReaction = async (
  _: unknown,
  {
    reactionData: { itemId, reaction },
  }: { reactionData: Record<"itemId" | "reaction", keyof ReactionsType> },
  { req }: APIContextFnType
) => {
  if (!itemId) {
    throw new GraphQLError("post id is required to add reaction on it", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (!reaction) {
    throw new GraphQLError("reaction is required to add it on the post", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  if (!flatReactions.includes(reaction)) {
    throw new GraphQLError(
      "reaction must be one of these reaction [like, love, sad, angry]",
      { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
    );
  }

  return await handleConnectDB({
    publicErrorMsg: "something went wrong while update reaction to this post",
    req,
    validateToken: true,
    async resolveCallback(user) {
      const oldPost = await checkForPostPrivacy(itemId, user._id);
      if (oldPost instanceof GraphQLError) throw oldPost;

      const oldUserReactionPromise = await Post.aggregate([
        { $match: { _id: new Types.ObjectId(itemId) } },
        {
          $facet: {
            like: [
              {
                $project: {
                  like: {
                    $in: [
                      new Types.ObjectId(user._id),
                      "$reactions.like.users",
                    ],
                  },
                },
              },
              { $match: { like: true } },
            ],
            love: [
              {
                $project: {
                  love: {
                    $in: [
                      new Types.ObjectId(user._id),
                      "$reactions.love.users",
                    ],
                  },
                },
              },
              { $match: { love: true } },
            ],
            sad: [
              {
                $project: {
                  sad: {
                    $in: [new Types.ObjectId(user._id), "$reactions.sad.users"],
                  },
                },
              },
              { $match: { sad: true } },
            ],
            angry: [
              {
                $project: {
                  angry: {
                    $in: [
                      new Types.ObjectId(user._id),
                      "$reactions.angry.users",
                    ],
                  },
                },
              },
              { $match: { angry: true } },
            ],
          },
        },
      ]);

      const oldUserReaction = Object.entries(oldUserReactionPromise?.[0]).find(
        ([key, value]) => {
          return !!(value as unknown as Record<string, boolean>[])?.[0]?.[key];
        }
      )?.[0];

      const modifyData = {
        $inc: {
          [`reactions.${reaction}.count`]:
            oldUserReaction === reaction ? -1 : 1,
        },

        [`$${oldUserReaction === reaction ? "pull" : "push"}`]: {
          [`reactions.${reaction}.users`]: user._id,
        },
      } as Record<string, unknown>;

      if (oldUserReaction && oldUserReaction !== reaction) {
        modifyData["$inc"] = {
          ...(modifyData["$inc"] as Record<string, unknown>),
          [`reactions.${oldUserReaction}.count`]: -1,
        };

        modifyData["$pull"] = {
          ...(modifyData["$pull"] as Record<string, unknown>),
          [`reactions.${oldUserReaction}.users`]: user._id,
        };
      }

      await Post.updateOne({ _id: itemId }, modifyData);

      if (!oldUserReaction && oldPost.owner._id.toString() !== user._id) {
        const finalReaction = `${reaction}${
          ["love", "like"].includes(reaction) ? "d" : " from"
        }`;

        const notification = {
          icon: reaction,
          content: `${user.username} ${finalReaction} your post`,
          url: `/post/${itemId}`,
        };

        await User.updateOne(
          { _id: oldPost.owner._id },
          {
            $push: {
              notifications: notification,
            },
          }
        );
      }

      return { message: `reaction updated successfully` };
    },
  });
};

export default toggleReaction;
