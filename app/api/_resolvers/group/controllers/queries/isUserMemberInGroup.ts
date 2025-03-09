// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import isUserMemberInGroupFn from "../../utils/isUserMemberInGroup";

// models
import Group from "../../../../_models/group.model";

// types
import type { APIContextFnType } from "@/lib/types";

const isUserMemberInGroupResolver = async (
  _: unknown,
  { groupId }: { groupId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    validateToken: true,
    req,
    publicErrorMsg:
      "something went wrong while asking if you follow this group or not",
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

      const isUserMemberInGroup = await isUserMemberInGroupFn(
        user._id,
        groupId
      );

      return {
        isUserMemberInGroup,
      };
    },
  });
};

export default isUserMemberInGroupResolver;
