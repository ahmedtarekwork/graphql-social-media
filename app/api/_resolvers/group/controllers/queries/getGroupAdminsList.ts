// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";
import isUserAdminInGroupFn from "../../utils/isUserAdminInGroup";

// models
import Group from "../../../../_models/group.model";

// types
import type { APIContextFnType, Pagination } from "@/lib/types";

const getGroupAdminsList = async (
  _: unknown,
  {
    paginationData: { groupId, limit = 0, page = 1, skip = 0 },
  }: { paginationData: Pagination<{ groupId: string; skip: number }> },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    validateToken: true,
    req,
    publicErrorMsg: "something went wrong while getting group admins list",
    async resolveCallback(user) {
      const mainSkipCount = (page - 1) * limit;

      if (!groupId) {
        throw new GraphQLError("group id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const groupDoc = await Group.findById(groupId).select("owner");

      if (!groupDoc) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserAdminInGroup = await isUserAdminInGroupFn(user._id, groupId);

      if (
        groupDoc.owner.toString() !== user._id.toString() &&
        !isUserAdminInGroup
      ) {
        throw new GraphQLError(
          "group owner or admins can only the admins list of page",
          { extensions: { code: "FORBIDDEN" } }
        );
      }

      const adminsList = await Group.aggregate([
        { $match: { _id: new Types.ObjectId(groupId) } },
        {
          $facet: {
            adminsCount: [
              {
                $project: {
                  adminsCount: {
                    $size: "$admins",
                  },
                },
              },
            ],

            admins: [
              { $unwind: "$admins" },
              {
                $skip: mainSkipCount + skip < 0 ? 0 : mainSkipCount + skip,
              },
              { $limit: limit },

              {
                $lookup: {
                  from: "users",
                  localField: "admins",
                  foreignField: "_id",
                  as: "adminInfo",
                },
              },

              {
                $unwind: "$adminInfo",
              },

              {
                $project: {
                  _id: 0,
                  adminInfo: {
                    _id: 1,
                    username: 1,
                    profilePicture: 1,
                  },
                },
              },

              {
                $group: {
                  _id: "$_id",
                  admins: {
                    $push: "$adminInfo",
                  },
                },
              },
            ],
          },
        },
      ]);

      const adminsCount = adminsList?.[0]?.adminsCount?.[0]?.adminsCount || 0;
      const admins = adminsList?.[0]?.admins?.[0]?.admins || [];

      return {
        admins,
        isFinalPage: page * limit >= adminsCount,
      };
    },
  });
};

export default getGroupAdminsList;
