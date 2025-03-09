// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { Types } from "mongoose";
import handleConnectDB from "@/lib/handleConnectDB";

// models
import Group from "../../../../_models/group.model";

// types
import { APIContextFnType } from "@/lib/types";

const isUserSentJoinRequest = async (
  _: unknown,
  { groupId }: { groupId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    validateToken: true,
    req,
    publicErrorMsg:
      "something went wrong while asking if you were sent a join request to this this group or not",
    async resolveCallback(user) {
      if (!groupId) {
        throw new GraphQLError("group id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      if (!(await Group.exists({ _id: groupId }))) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserSentJoinRequest = await Group.aggregate([
        { $match: { _id: new Types.ObjectId(groupId) } },
        {
          $project: {
            isUserSentJoinRequest: {
              $in: [new Types.ObjectId(user._id), "$joinRequests.user"],
            },
          },
        },
        { $match: { isUserSentJoinRequest: true } },
      ]);

      return {
        isUserSentJoinRequest:
          !!isUserSentJoinRequest?.[0]?.isUserSentJoinRequest,
      };
    },
  });
};

export default isUserSentJoinRequest;
