// types
import type { Pagination } from "@/lib/types";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import User from "../../../../_models/user.model";

const getUserFriends = async (
  _: unknown,
  {
    friendsPagination: { page = 1, limit = 0, userId },
  }: { friendsPagination: Pagination & { userId: string } }
) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting your friends",

    async resolveCallback() {
      const result = await User.aggregate([
        { $match: { _id: new Types.ObjectId(userId) } },
        {
          $facet: {
            friendsCount: [
              {
                $project: {
                  friendsCount: {
                    $size: { $ifNull: ["$friendsList", []] },
                  },
                },
              },
            ],

            friendsList: [
              { $unwind: "$friendsList" },
              { $skip: (page - 1) * limit },
              { $limit: limit },

              {
                $lookup: {
                  from: "users",
                  localField: "friendsList",
                  foreignField: "_id",
                  as: "userInfo",
                },
              },
              {
                $project: {
                  _id: 1,
                  friendsList: 1,
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
                  friendsList: {
                    $push: "$userInfo",
                  },
                },
              },
            ],
          },
        },
      ]);

      return {
        friends: result?.[0]?.friendsList?.[0]?.friendsList?.[0] || [],
        isFinalPage: result?.[0]?.friendsCount?.[0]?.friendsCount || true,
      };
    },
  });
};

export default getUserFriends;
