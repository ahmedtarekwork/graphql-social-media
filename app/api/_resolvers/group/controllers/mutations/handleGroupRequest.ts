// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserAdminInGroupFn from "../../utils/isUserAdminInGroup";

// models
import Group from "../../../../_models/group.model";
import User from "../../../../_models/user.model";

// types
import type { APIContextFnType } from "@/lib/types";

const handleGroupRequest = async (
  _: unknown,
  {
    handleGroupRequestData: { acception, requestId, groupId, senderId },
  }: {
    handleGroupRequestData: {
      acception: boolean;
      requestId: string;
      groupId: string;
      senderId: string;
    };
  },
  { req }: APIContextFnType
) => {
  if (!requestId || !groupId) {
    throw new GraphQLError(`${!groupId ? "group" : "request"} id is required`, {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  if (typeof acception !== "boolean") {
    throw new GraphQLError("request opinion must be provided", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while handle join request",
    async resolveCallback(user) {
      const group = (await Group.findById(groupId).select("owner"))?._doc;

      if (!group) {
        throw new GraphQLError(
          "there is no group has join request with given id",
          { extensions: { code: "NOT_FOUND" } }
        );
      }

      const isAuthUserAdminInGroup = await isUserAdminInGroupFn(
        user._id,
        groupId
      );

      if (
        !isAuthUserAdminInGroup &&
        group.owner.toString() !== user._id.toString()
      ) {
        throw new GraphQLError("you don't have access to group join requests", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      if (acception) {
        await User.updateOne(
          { _id: senderId },
          {
            $push: {
              joinedGroups: group._id.toString(),
            },
          }
        );
      }

      const newGroupInfo: Record<string, unknown> = {
        $pull: { joinRequests: { _id: requestId } },
      };

      if (acception) newGroupInfo.$inc = { membersCount: 1 };

      await Group.updateOne({ _id: groupId }, newGroupInfo);

      return {
        message: acception
          ? "request successfully accepted"
          : "request has been denied successfully",
      };
    },
  });
};

export default handleGroupRequest;
