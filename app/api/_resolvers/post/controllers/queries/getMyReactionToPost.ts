// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// types
import type { APIContextFnType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Post from "../../../../_models/post.model";

const getMyReactionToPost = async (
  _: unknown,
  { itemId: postId }: { itemId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    publicErrorMsg: "can't get your reaction to this post at the momment",
    validateToken: true,
    req,
    async resolveCallback(user) {
      if (!postId) {
        throw new GraphQLError("post id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const result = await Post.aggregate([
        { $match: { _id: new Types.ObjectId(postId) } },
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

export default getMyReactionToPost;
