// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import Post from "../../../../_models/post.model";

// types
import type { Pagination } from "@/lib/types";

const getPostSharesUsers = async (
  _: unknown,
  {
    sharesInfo: { postId, limit = 0, page = 1 },
  }: { sharesInfo: Pagination<{ postId: string }> }
) => {
  return await handleConnectDB({
    publicErrorMsg: "can't get post shares at the momment",
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
            sharedCount: [
              {
                $project: {
                  sharedCount: {
                    $size: "$shareData.users",
                  },
                },
              },
            ],

            shares: [
              { $unwind: "$shareData.users" },
              { $skip: (page - 1) * limit },
              { $limit: limit },
              {
                $lookup: {
                  from: "users",
                  localField: "shareData.users",
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
                  shares: { $push: "$userInfo" },
                },
              },
            ],
          },
        },
      ]);

      const shares = result?.[0]?.shares?.[0]?.shares || [];

      const sharesCount = result?.[0]?.sharesCount?.[0]?.sharesCount || 0;

      return {
        isFinalPage: page * limit >= sharesCount,
        shares,
      };
    },
  });
};

export default getPostSharesUsers;
