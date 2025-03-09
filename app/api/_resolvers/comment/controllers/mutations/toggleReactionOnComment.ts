// constants
import { flatReactions } from "@/constants/reactions";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";
import { checkForPrivacy } from "@/lib/checkForPostPrivacy";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Comment from "../../../../_models/comment.model";

// types
import type { APIContextFnType, ReactionsType } from "@/lib/types";

const toggleReactionOnComment = async (
  _: unknown,
  {
    reactionData: { itemId: commentId, reaction },
  }: { reactionData: { itemId: string; reaction: keyof ReactionsType } },
  { req }: APIContextFnType
) => {
  if (!commentId) {
    throw new GraphQLError("comment id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (!reaction) {
    throw new GraphQLError("you need to provide a reaction", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (!flatReactions.includes(reaction)) {
    throw new GraphQLError(
      "reaction must be one of this types [like, love, sad, angry]"
    );
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while update the reaction",
    async resolveCallback(user) {
      const comment = (
        await Comment.findById(commentId).populate({
          path: "post",
          select: "_id privacy owner",
        })
      )?._doc;

      const privacyChecker = checkForPrivacy(comment.post._doc, user._id);
      if (privacyChecker instanceof GraphQLError) throw privacyChecker;

      const oldUserReactionPromise = await Comment.aggregate([
        { $match: { _id: new Types.ObjectId(commentId) } },
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

      await Comment.updateOne({ _id: commentId }, modifyData);

      return { message: "reaction updated successfully" };
    },
  });
};

export default toggleReactionOnComment;
