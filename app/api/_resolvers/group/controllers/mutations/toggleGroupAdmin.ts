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

const toggleGroupAdmin = async (
  _: unknown,
  {
    toggleAdminData: { newAdminId, groupId, toggle },
  }: {
    toggleAdminData: Record<"newAdminId" | "groupId", string> & {
      toggle: "add" | "remove";
    };
  },
  { req }: APIContextFnType
) => {
  if (!groupId || !newAdminId) {
    throw new GraphQLError(`${!groupId ? "group" : "admin"} id is required`, {
      extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
    });
  }

  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: `something went wrong while ${toggle} admin ${
      toggle === "add" ? "to" : "from"
    } group`,
    async resolveCallback(user) {
      const group = (await Group.findById(groupId).select("owner"))?._doc;

      let removeMySelf = false;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserAdminInGroup = await isUserAdminInGroupFn(
        newAdminId,
        groupId
      );

      if (
        !(
          newAdminId === user._id &&
          isUserAdminInGroup &&
          toggle === "remove"
        ) &&
        group.owner.toString() !== user._id
      ) {
        throw new GraphQLError(
          "group owner can only modify admins list of the group",
          {
            extensions: { code: "FORBIDDEN" },
          }
        );
      }

      if (
        newAdminId === user._id &&
        isUserAdminInGroup &&
        toggle === "remove"
      ) {
        removeMySelf = true;
      }

      if (newAdminId === user._id && group.owner.toString() === user._id) {
        throw new GraphQLError(
          "you can't add or remove your self from group admins because you are the owner"
        );
      }

      if (toggle === "remove" && !isUserAdminInGroup) {
        throw new GraphQLError("this user not in admins list of the group", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }
      if (toggle === "add" && isUserAdminInGroup) {
        throw new GraphQLError(
          "this user already in admins list of the group",
          { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
        );
      }

      await Group.updateOne(
        { _id: groupId },
        {
          [`$${isUserAdminInGroup ? "pull" : "push"}`]: {
            admins: newAdminId,
          },
        }
      );

      await User.updateOne(
        { _id: newAdminId },
        {
          [`$${isUserAdminInGroup ? "pull" : "push"}`]: {
            adminGroup: groupId,
          },
        }
      );

      return {
        message: removeMySelf
          ? "you have been left from admins list of the group"
          : `admin ${
              isUserAdminInGroup ? "removed from" : "added to"
            } the group successfully`,
      };
    },
  });
};

export default toggleGroupAdmin;
