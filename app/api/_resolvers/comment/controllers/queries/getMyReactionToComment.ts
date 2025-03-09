// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { Types } from "mongoose";
import handleConnectDB from "@/lib/handleConnectDB";

// models
import Comment from "../../../../_models/comment.model";

// types
import type { APIContextFnType } from "@/lib/types";

const getMyReactionToComment = async (
  _: unknown,
  { itemId: commentId }: { itemId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    publicErrorMsg: "can't get your reaction to this comment at the momment",
    validateToken: true,
    req,
    async resolveCallback(user) {
      if (!commentId) {
        throw new GraphQLError("comment id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const result = await Comment.aggregate([
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

      return {
        reaction: Object.entries(result?.[0]).find(([key, value]) => {
          return (value as Record<string, unknown>[])?.[0]?.[key];
        })?.[0],
      };
    },
  });
};

export default getMyReactionToComment;
