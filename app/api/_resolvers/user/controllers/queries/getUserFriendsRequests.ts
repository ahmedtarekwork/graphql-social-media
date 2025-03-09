// models
import User from "../../../../_models/user.model";

// types
import type { APIContextFnType, Pagination } from "@/lib/types";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

const getUserFriendsRequests = async (
  _: unknown,
  {
    requestsPagination: { page = 1, limit = 0 },
  }: { requestsPagination: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg:
      "something went wrong while getting your friendship requests",

    async resolveCallback(user) {
      const result = await User.aggregate([
        { $match: { _id: new Types.ObjectId(user._id) } },
        {
          $facet: {
            friendsRequestsCount: [
              {
                $project: {
                  friendsRequestsCount: {
                    $size: { $ifNull: ["$friendsRequests", []] },
                  },
                },
              },
            ],

            friendsRequests: [
              { $unwind: "$friendsRequests" },
              { $skip: (page - 1) * limit },
              { $limit: limit },

              {
                $lookup: {
                  from: "users",
                  localField: "friendsRequests",
                  foreignField: "_id",
                  as: "userInfo",
                },
              },
              {
                $project: {
                  _id: 1,
                  friendsRequests: 1,
                  userInfo: {
                    username: 1,
                    _id: 1,
                    profilePicture: 1,
                  },
                },
              },

              {
                $group: {
                  _id: "$_id",
                  friendsRequests: {
                    $push: "$userInfo",
                  },
                },
              },
            ],
          },
        },
      ]);

      const friendsRequestsCount =
        result[0]?.friendsRequestsCount?.[0]?.friendsRequestsCount;
      const friendsRequests =
        result?.[0]?.friendsRequests?.[0]?.friendsRequests?.[0];

      return {
        friendsRequests: friendsRequests || [],
        isFinalPage: page * limit >= friendsRequestsCount || true,
      };
    },
  });
};

export default getUserFriendsRequests;
