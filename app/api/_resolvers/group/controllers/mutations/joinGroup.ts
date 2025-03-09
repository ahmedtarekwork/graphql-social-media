// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import isUserMemberInGroupFn from "../../utils/isUserMemberInGroup";
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// models
import Group from "../../../../_models/group.model";
import User from "../../../../_models/user.model";

// types
import type { APIContextFnType } from "@/lib/types";

const joinGroup = async (
  _: unknown,
  { groupId }: { groupId: string },
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
    publicErrorMsg:
      "something went wrong while try to joining you in the group",
    async resolveCallback(user) {
      const group = (await Group.findById(groupId).select("owner privacy"))
        ?._doc;

      if (!group) {
        throw new GraphQLError("group with given id not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isUserMemberInGroup = await isUserMemberInGroupFn(
        user._id,
        groupId
      );

      if (isUserMemberInGroup) {
        throw new GraphQLError("you are already member in this group", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (group.privacy === "members_only") {
        await Group.updateOne(
          { _id: groupId },
          {
            $push: {
              joinRequests: {
                user: user._id,
              },
            },
          }
        );

        const notification = {
          content: `${user._id} sent a request to join ${group.name} group`,
          icon: "group",
          url: `/groups/${group._id.toString()}`,
        };

        const groupAdminsIDs =
          (
            await Group.aggregate([
              {
                $match: {
                  _id: new Types.ObjectId(groupId),
                },
              },
              {
                $project: {
                  admins: 1,
                },
              },
            ])
          )?.[0]?.admins || [];

        await User.updateMany(
          {
            $or: [...groupAdminsIDs, group.owner].map((_id) => ({ _id })),
          },
          {
            $push: { notifications: notification },
          }
        );

        return { message: "your request has been sent to group admins" };
      }

      await User.updateOne(
        { _id: user._id },
        { $push: { joinedGroups: groupId } }
      );

      await Group.updateOne({ _id: groupId }, { $inc: { membersCount: 1 } });

      return {
        message: "you are successfully joined to this group",
      };
    },
  });
};

export default joinGroup;
