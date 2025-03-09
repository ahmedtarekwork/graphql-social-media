// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// types
import type { Pagination, ReactionsType } from "@/lib/types";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Post from "../../../../_models/post.model";

const getPostReactions = async (
  _: unknown,
  {
    reactionsInfo: { itemId: postId, limit = 0, page = 1, reaction = "like" },
  }: {
    reactionsInfo: Pagination<{
      itemId: string;
      reaction: keyof ReactionsType;
    }>;
  }
) => {
  return await handleConnectDB({
    publicErrorMsg: "can't get post reactions at the momment",
    async resolveCallback() {
      if (!postId) {
        throw new GraphQLError("post id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const result = await Post.aggregate([
        { $match: { _id: new Types.ObjectId(postId) } },
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

export default getPostReactions;
