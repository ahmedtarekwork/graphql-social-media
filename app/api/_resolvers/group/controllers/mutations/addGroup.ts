// utils
import handleConnectDB from "@/lib/handleConnectDB";

// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// models
import Group from "../../../../_models/group.model";
import User from "../../../../_models/user.model";

// types
import type { APIContextFnType, GroupInputDataType } from "@/lib/types";

const addGroup = async (
  _: unknown,
  { groupData }: { groupData: GroupInputDataType },
  { req }: APIContextFnType
) => {
  if (!groupData.name) {
    throw new GraphQLError("group name is required", {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while create a new group",
    async resolveCallback(user) {
      const group = (
        await Group.create({
          ...groupData,
          owner: user._id,
        })
      )?._doc;

      if (!group) {
        throw new GraphQLError("can't create the group at the momment", {
          extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
        });
      }

      await User.updateOne(
        { _id: user._id },
        {
          $push: {
            ownedGroups: group._id.toString(),
          },
        }
      );

      return group;
    },
  });
};
export default addGroup;
