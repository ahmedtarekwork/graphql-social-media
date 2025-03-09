// types
import type { APIContextFnType, Pagination } from "@/lib/types";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import User from "../../../../_models/user.model";

const getUserSavedPosts = async (
  _: unknown,
  {
    postsPaginations: { page = 1, limit = 0 },
  }: { postsPaginations: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while getting your saved posts",
    async resolveCallback(user) {
      const result = await User.aggregate([
        { $match: { _id: new Types.ObjectId(user._id) } },
        {
          $facet: {
            savedPostsCount: [
              {
                $project: {
                  savedPostsCount: {
                    $size: "$savedPosts",
                  },
                },
              },
            ],

            savedPosts: [
              { $unwind: "$savedPosts" },
              { $skip: (page - 1) * limit },
              { $limit: limit },

              {
                $lookup: {
                  from: "posts",
                  localField: "savedPosts",
                  foreignField: "_id",
                  as: "postInfo",
                },
              },
              {
                $unwind: "$postInfo",
              },
              {
                $project: {
                  _id: 1,
                  postInfo: {
                    _id: 1,
                    caption: 1,
                    media: {
                      $cond: {
                        if: { $isArray: "$postInfo.media" },
                        then: { $arrayElemAt: ["$postInfo.media", 0] },
                        else: null,
                      },
                    },
                  },
                },
              },

              {
                $group: {
                  _id: "$_id",
                  savedPosts: { $push: "$postInfo" },
                },
              },
            ],
          },
        },
      ]);

      const savedPosts = result?.[0]?.savedPosts?.[0]?.savedPosts || [];
      const savedPostsCount =
        result?.[0]?.savedPostsCount?.[0]?.savedPostsCount || 0;

      return {
        savedPosts,
        isFinalPage: page * limit >= savedPostsCount,
      };
    },
  });
};

export default getUserSavedPosts;
