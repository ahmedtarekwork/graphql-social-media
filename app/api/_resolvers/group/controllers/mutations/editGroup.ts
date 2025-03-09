// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import isUserAdminInGroupFn from "../../utils/isUserAdminInGroup";
import handleConnectDB from "@/lib/handleConnectDB";

// models
import Group from "../../../../_models/group.model";

// types
import { APIContextFnType, GroupInputDataType } from "@/lib/types";

const editGroup = async (
  _: unknown,
  {
    editGroupData: { groupId, ...newGroupData },
  }: { editGroupData: GroupInputDataType & { groupId: string } },
  { req }: APIContextFnType
) => {
  if (!groupId) {
    throw new GraphQLError("group id is required", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  if (!Object.keys(newGroupData || {}).length) {
    throw new GraphQLError("you must provide some data to update group info", {
      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while update group info",
    async resolveCallback(user) {
      const group = (await Group.findById(groupId).select("owner name"))?._doc;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserAdminInGroup = await isUserAdminInGroupFn(user._id, groupId);

      if (group.owner.toString() !== user._id && !isUserAdminInGroup) {
        throw new GraphQLError(
          "group owner or admins can only edit group info",
          {
            extensions: { code: "FORBIDDEN" },
          }
        );
      }

      if ("name" in newGroupData && newGroupData.name === group.name) {
        throw new GraphQLError("you can't update group name with same value", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      await Group.updateOne({ _id: groupId }, newGroupData);

      return { message: "group info updated successfully" };
    },
  });
};

export default editGroup;
