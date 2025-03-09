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
import { APIContextFnType, Pagination } from "@/lib/types";

const getGroupJoinRequests = async (
  _: unknown,
  {
    requestsPaginationInfo: { groupId, limit = 0, page = 1 },
  }: {
    requestsPaginationInfo: Pagination<{ groupId: string }>;
  },
  { req }: APIContextFnType
) => {
  if (!groupId) {
    throw new GraphQLError("group id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while getting group join requests",
    async resolveCallback(user) {
      const group = (await Group.findById(groupId).select("owner"))?._doc;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserAdminInGroup = await isUserAdminInGroupFn(user._id, groupId);

      if (
        !isUserAdminInGroup &&
        user._id.toString() !== group.owner.toString()
      ) {
        throw new GraphQLError("you don't have access to this data", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await Group.aggregate([
        { $match: { _id: new Types.ObjectId(groupId) } },
        {
          $project: {
            joinRequests: 1,
            totalCount: { $size: "$joinRequests" },
          },
        },
        { $unwind: "$joinRequests" },
        {
          $lookup: {
            from: "users",
            let: { userId: "$joinRequests.user" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
              { $project: { _id: 1, username: 1, profilePicture: 1 } },
            ],
            as: "joinRequests.user",
          },
        },
        { $unwind: "$joinRequests.user" },
        {
          $addFields: {
            "joinRequests.user": {
              _id: "$joinRequests.user._id",
              username: "$joinRequests.user.username",
              profilePicture: "$joinRequests.user.profilePicture",
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: "$joinRequests",
          },
        },
        {
          $facet: {
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            totalCount: [{ $group: { _id: null, count: { $sum: 1 } } }],
          },
        },
        {
          $project: {
            data: 1,
            totalCount: { $arrayElemAt: ["$totalCount.count", 0] },
          },
        },
      ]);

      const joinRequests = result?.[0]?.data || [];
      const totalCount = result?.[0]?.totalCount || 0;

      return {
        requests: joinRequests,
        isFinalPage: page * limit > totalCount,
      };
    },
  });
};

export default getGroupJoinRequests;
