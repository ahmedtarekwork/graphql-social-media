// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { Types } from "mongoose";
import handleConnectDB from "@/lib/handleConnectDB";

// models
import Comment from "../../../../_models/comment.model";

// types
import type { Pagination, ReactionsType } from "@/lib/types";

const getCommentReactions = async (
  _: unknown,
  {
    reactionsInfo: {
      itemId: commentId,
      limit = 0,
      page = 1,
      reaction = "like",
    },
  }: {
    reactionsInfo: Pagination<{
      itemId: string;
      reaction: keyof ReactionsType;
    }>;
  }
) => {
  return await handleConnectDB({
    publicErrorMsg: "can't get comment reactions at the momment",
    async resolveCallback() {
      if (!commentId) {
        throw new GraphQLError("comment id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const result = await Comment.aggregate([
        { $match: { _id: new Types.ObjectId(commentId) } },
        {
          $facet: {
            reactionsCount: [
              {
                $project: {
                  reactionsCount: {
                    $size: `$reactions.${reaction}.users`,
                  },
                },
              },
            ],

            reactions: [
              { $unwind: `$reactions.${reaction}.users` },
              { $skip: (page - 1) * limit },
              { $limit: limit },
              {
                $lookup: {
                  from: "users",
                  localField: `reactions.${reaction}.users`,
                  foreignField: "_id",
                  as: "userInfo",
                },
              },

              {
                $unwind: "$userInfo",
              },

              {
                $project: {
                  _id: 0,
                  userInfo: {
                    _id: 1,
                    username: 1,
                    profilePicture: 1,
                  },
                },
              },

              {
                $group: {
                  _id: "$_id",
                  reactions: { $push: "$userInfo" },
                },
              },
            ],
          },
        },
      ]);

      const reactions = result?.[0]?.reactions?.[0]?.reactions || [];

      const reactionsCount =
        result?.[0]?.reactionsCount?.[0]?.reactionsCount || 0;

      return {
        isFinalPage: page * limit >= reactionsCount,
        reactions,
      };
    },
  });
};

export default getCommentReactions;
