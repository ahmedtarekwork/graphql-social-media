// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import User from "../../../../_models/user.model";

// types
import type { APIContextFnType, Pagination } from "@/lib/types";

const getFollowedPages = async (
  _: unknown,
  { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting your followed pages",
    req,
    validateToken: true,

    async resolveCallback(user) {
      const result = await User.aggregate([
        { $match: { _id: new Types.ObjectId(user._id) } },
        {
          $facet: {
            pagesCount: [
              {
                $project: {
                  pagesCount: {
                    $size: { $ifNull: ["$followedPages", []] },
                  },
                },
              },
            ],

            pages: [
              { $unwind: "$followedPages" },
              { $skip: (page - 1) * limit },
              { $limit: limit },

              {
                $lookup: {
                  from: "pages",
                  localField: "followedPages",
                  foreignField: "_id",
                  as: "pageInfo",
                },
              },
              {
                $project: {
                  _id: 1,
                  pageInfo: {
                    _id: 1,
                    name: 1,
                    profilePicture: 1,
                    followersCount: 1,
                  },
                },
              },

              {
                $group: {
                  _id: "$_id",
                  pages: {
                    $push: "$pageInfo",
                  },
                },
              },
            ],
          },
        },
      ]);

      return {
        pages: result?.[0]?.pages?.[0]?.pages?.[0] || [],
        isFinalPage:
          page * limit >= result?.[0]?.pagesCount?.[0]?.pagesCount || 0,
      };
    },
  });
};

export default getFollowedPages;
