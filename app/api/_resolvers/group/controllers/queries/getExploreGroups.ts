// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// types
import type { APIContextFnType, Pagination } from "@/lib/types";

// models
import Group from "../../../../_models/group.model";

const getExploreGroups = async (
  _: unknown,
  { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting available groups",
    req,
    validateToken: true,
    async resolveCallback(user) {
      const groupsResult = await Group.aggregate([
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
                  joinedGroups: { $ifNull: ["$joinedGroups", []] },
                  adminGroups: { $ifNull: ["$adminGroups", []] },
                  ownedGroups: { $ifNull: ["$ownedGroups", []] },
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
                  { $in: ["$_id", "$authUserDetails.joinedGroups"] },
                  { $in: ["$_id", "$authUserDetails.adminGroups"] },
                  { $in: ["$_id", "$authUserDetails.ownedGroups"] },
                ],
              },
            },
          },
        },

        {
          $facet: {
            metadata: [{ $count: "total" }],

            groups: [
              { $limit: limit },
              { $skip: (page - 1) * limit },

              {
                $project: {
                  _id: 1,
                  name: 1,
                  profilePicture: 1,
                  membersCount: 1,
                },
              },
            ],
          },
        },
      ]);

      const groups = groupsResult?.[0]?.groups || [];
      const count = groupsResult?.[0]?.metadata?.[0]?.total || 0;

      return { groups, isFinalPage: page * limit >= count };
    },
  });
};

export default getExploreGroups;
