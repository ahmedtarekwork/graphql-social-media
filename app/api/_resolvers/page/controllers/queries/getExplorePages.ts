// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import Page from "../../../../_models/page.model";

// types
import type { APIContextFnType, Pagination } from "@/lib/types";

const getExplorePages = async (
  _: unknown,
  { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "can't get available pages at the momment",
    async resolveCallback(user) {
      const pagesResult = await Page.aggregate([
        {
          $lookup: {
            from: "users",
            let: {
              authenticatedUserId: new Types.ObjectId(user._id),
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$authenticatedUserId"],
                  },
                },
              },
              {
                $project: {
                  followedPages: { $ifNull: ["$followedPages", []] },
                  adminPages: { $ifNull: ["$adminPages", []] },
                  ownedPages: { $ifNull: ["$ownedPages", []] },
                },
              },
            ],
            as: "authUserDetails",
          },
        },
        { $unwind: "$authUserDetails" },

        {
          $match: {
            $expr: {
              $not: {
                $or: [
                  { $in: ["$_id", "$authUserDetails.followedPages"] },
                  { $in: ["$_id", "$authUserDetails.adminPages"] },
                  { $in: ["$_id", "$authUserDetails.ownedPages"] },
                ],
              },
            },
          },
        },

        {
          $facet: {
            metadata: [{ $count: "total" }],

            pages: [
              { $limit: limit },
              { $skip: (page - 1) * limit },

              {
                $project: {
                  _id: 1,
                  name: 1,
                  profilePicture: 1,
                  followersCount: 1,
                },
              },
            ],
          },
        },
      ]);

      const pages = pagesResult?.[0]?.pages || [];
      const count = pagesResult?.[0]?.metadata?.[0]?.total || 0;

      return { pages, isFinalPage: page * limit >= count };
    },
  });
};

export default getExplorePages;
