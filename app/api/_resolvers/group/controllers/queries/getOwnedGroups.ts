// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import User from "../../../../_models/user.model";

// types
import { APIContextFnType, Pagination } from "@/lib/types";

const getOwnedGroups = async (
  _: unknown,
  { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting your owned groups",
    req,
    validateToken: true,
    async resolveCallback(user) {
      const result = await User.aggregate([
        { $match: { _id: new Types.ObjectId(user._id) } },
        {
          $facet: {
            groupsCount: [
              {
                $project: {
                  groupsCount: {
                    $size: { $ifNull: ["$ownedGroups", []] },
                  },
                },
              },
            ],

            groups: [
              { $unwind: "$ownedGroups" },
              { $skip: (page - 1) * limit },
              { $limit: limit },

              {
                $lookup: {
                  from: "groups",
                  localField: "ownedGroups",
                  foreignField: "_id",
                  as: "groupInfo",
                },
              },
              {
                $project: {
                  _id: 1,
                  groupInfo: {
                    _id: 1,
                    name: 1,
                    profilePicture: 1,
                    membersCount: 1,
                  },
                },
              },

              {
                $group: {
                  _id: "$_id",
                  groups: {
                    $push: "$groupInfo",
                  },
                },
              },
            ],
          },
        },
      ]);

      return {
        groups: result?.[0]?.groups?.[0]?.groups?.[0] || [],
        isFinalPage:
          page * limit >= result?.[0]?.groupsCount?.[0]?.groupsCount || 0,
      };
    },
  });
};

export default getOwnedGroups;
