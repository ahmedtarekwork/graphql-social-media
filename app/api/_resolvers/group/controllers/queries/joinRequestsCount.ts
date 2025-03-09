// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { Types } from "mongoose";
import handleConnectDB from "@/lib/handleConnectDB";
import isUserAdminInGroupFn from "../../utils/isUserAdminInGroup";

// models
import Group from "../../../../_models/group.model";

// types
import type { APIContextFnType } from "@/lib/types";

const joinRequestsCount = async (
  _: unknown,
  { groupId }: { groupId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    validateToken: true,
    req,
    publicErrorMsg:
      "something went wrong while getting group join request count",
    async resolveCallback(user) {
      if (!groupId) {
        throw new GraphQLError("group id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const group = (await Group.findById(groupId).select("privacy owner"))
        ?._doc;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserAdminInGroup = await isUserAdminInGroupFn(user._id, groupId);

      if (
        group.owner.toString() !== user._id.toString() &&
        !isUserAdminInGroup
      ) {
        throw new GraphQLError(
          "group owner or admin only can access group join requests count",
          { extensions: { code: "FORBIDDEN" } }
        );
      }

      if (group.privacy === "pulblic") {
        throw new GraphQLError("group with given id is public", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      const JoinRequestsCount = await Group.aggregate([
        { $match: { _id: new Types.ObjectId(groupId) } },
        {
          $project: {
            JoinRequestsCount: {
              $size: "$joinRequests",
            },
          },
        },
      ]);

      return {
        count: JoinRequestsCount?.[0]?.JoinRequestsCount || 0,
      };
    },
  });
};

export default joinRequestsCount;
