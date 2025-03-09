// gql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import isUserAdminInGroupFn from "../../utils/isUserAdminInGroup";
import handleConnectDB from "@/lib/handleConnectDB";

// types
import type { APIContextFnType } from "@/lib/types";

// models
import Group from "../../../../_models/group.model";

const isUserAdminInGroupResolver = async (
  _: unknown,
  { groupId }: { groupId: string },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    validateToken: true,
    req,
    publicErrorMsg:
      "something went wrong while asking if you are admin in this group or not",
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

      const isUserAdminInGroup = await isUserAdminInGroupFn(user._id, groupId);

      return { isUserAdminInGroup };
    },
  });
};

export default isUserAdminInGroupResolver;
