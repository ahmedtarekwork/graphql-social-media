// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { deleteMedia } from "@/lib/utils";
import { Types } from "mongoose";

// models
import User from "../_models/user.model";
import Post from "../_models/post.model";
import Group from "../_models/group.model";

// types
import type { APIContextFnType, ImageType, Pagination } from "@/lib/types";

type GroupInputData = { name: string } & Record<
  "profilePicture" | "coverPicture",
  ImageType
>;

const groupResolvers = {
  Query: {
    getgroups: async (
      _: unknown,
      { wantedGroups: { page = 1, limit = 0 } }: { wantedGroups: Pagination }
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting the groups",
        async resolveCallback() {
          const groups = await Group.find()
            .limit(limit)
            .skip(limit * (page - 1));

          if (!groups) {
            throw new GraphQLError("can't get groups at the momment", {
              extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
            });
          }

          return groups;
        },
      }),

    getSingleGroup: async (_: undefined, { groupId }: { groupId: string }) => {
      if (!groupId) {
        throw new GraphQLError("group id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        publicErrorMsg: "something went wrong while getting group info",
        async resolveCallback() {
          const group = await Group.findById(groupId);

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          return group;
        },
      });
    },

    getGroupJoinRequests: async (
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
        publicErrorMsg:
          "something went wrong while getting group join requests",
        async resolveCallback(user) {
          const group = (await Group.findById(groupId).select("owner admins"))
            ?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserHaveAccess = [...group.admins, group.owner].some(
            (id: typeof Types.ObjectId) => id.toString() === user._id
          );

          if (!isUserHaveAccess) {
            throw new GraphQLError("you don't have access to this data", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          return (
            await Group.findById(groupId)
              .select("joinRequests")
              .populate({
                path: "joinRequests.user",
                options: {
                  limit,
                  skip: (page - 1) * limit,
                },
              })
          )?._doc.joinRequests;
        },
      });
    },
  },

  Mutation: {
    addGroup: async (
      _: unknown,
      { addGroupData }: { addGroupData: GroupInputData },
      { req }: APIContextFnType
    ) => {
      if (!addGroupData.name) {
        throw new GraphQLError("group name is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while create a new group",
        async resolveCallback(user) {
          if (await Group.exists({ name: addGroupData.name })) {
            throw new GraphQLError("this group name is already taken", {
              extensions: { code: "CONFLICT" },
            });
          }

          const group = (
            await Group.create({
              ...addGroupData,
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
                ownedGroups: group._id,
              },
            }
          );

          return group;
        },
      });
    },
    editGroup: async (
      _: unknown,
      {
        editGroupData: { groupId, ...newGroupData },
      }: { editGroupData: GroupInputData & { groupId: string } },
      { req }: APIContextFnType
    ) => {
      if (!groupId) {
        throw new GraphQLError("group id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      if (!Object.keys(newGroupData || {}).length) {
        throw new GraphQLError(
          "you must provide some data to update group info",
          { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while update group info",
        async resolveCallback(user) {
          const group = (await Group.findById(groupId))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          if (group.owner.toString !== user._id) {
            throw new GraphQLError("group owner can only edit group info", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          if ("name" in newGroupData && newGroupData.name === group.name) {
            throw new GraphQLError(
              "you can't update group name with same value",
              { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
            );
          }

          const updatedGroup = (
            await Group.findByIdAndUpdate(groupId, newGroupData, {
              new: true,
            })
          )?._doc;

          return updatedGroup;
        },
      });
    },
    deleteGroup: async (
      _: unknown,
      { groupId }: { groupId: string },
      { req }: APIContextFnType
    ) => {
      if (!groupId) {
        throw new GraphQLError("group id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while create a new group",
        async resolveCallback(user) {
          const group = (await Group.findById(groupId))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          if (group.owner.toString !== user._id) {
            throw new GraphQLError("group owner can only delete the group", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          await Group.deleteOne({ _id: groupId });
          const removeOwnerFromGroup = User.updateOne(
            { _id: user._id },
            {
              $pull: { ownedGroups: groupId },
            }
          );

          const removeAdminsFromGroup = User.updateMany(
            { _id: { $or: group.admins } },
            {
              $pull: {
                adminGroups: groupId,
              },
            }
          );

          const removeMembersFromGroup = User.updateMany(
            { joinedGroups: groupId },
            {
              $pull: { joinedGroups: groupId },
            }
          );

          const promisesArr: Promise<unknown>[] = [
            removeOwnerFromGroup,
            removeAdminsFromGroup,
            removeMembersFromGroup,
          ];

          const mediaArr = [
            group.profilePicture?.public_id,
            group.coverPicture?.public_id,
          ].filter(Boolean);

          if (mediaArr.length) promisesArr.push(deleteMedia(mediaArr));

          await Promise.allSettled(promisesArr);

          return { message: "group deleted successfully" };
        },
      });
    },

    toggleGroupAdmin: async (
      _: unknown,
      {
        toggleGroupAdminData: { adminId, groupId },
      }: { toggleGroupAdminData: Record<"adminId" | "groupId", string> },
      { req }: APIContextFnType
    ) => {
      if (!groupId || !adminId) {
        throw new GraphQLError(
          `${!groupId ? "group" : "admin"} id is required`,
          {
            extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
          }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while handle the proccess",
        async resolveCallback(user) {
          const group = (await Group.findById(groupId))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAlreadyAdmin = group.admins.some(
            (id: typeof Types.ObjectId) => id.toString() === user._id
          );

          if (adminId === user._id && isUserAlreadyAdmin) {
            await Group.updateOne(
              { _id: groupId },
              { $pull: { admins: adminId } }
            );

            return {
              message: "you have been left from admins list of the group",
            };
          }

          if (adminId === user._id && group.owner.toString() === user._id) {
            throw new GraphQLError(
              "you can't remove your self from group admins because you are the owner"
            );
          }

          if (group.owner.toString() !== user._id) {
            throw new GraphQLError(
              "group owner can only add admins to the group",
              {
                extensions: { code: "FORBIDDEN" },
              }
            );
          }

          if (!isUserAlreadyAdmin) {
            const user = (await User.findById(adminId).select("joinedGroups"))
              ?._doc;

            if (!user) {
              throw new GraphQLError("user with given id not found", {
                extensions: { code: "NOT_FOUND" },
              });
            }
            const isMember = user.joinedGroups.some(
              (id: typeof Types.ObjectId) => id.toString() === groupId
            );

            if (!isMember) {
              throw new GraphQLError(
                "user must be a member before make him admin",
                { extensions: { code: "FORBIDDEN" } }
              );
            }
          }

          await Group.updateOne(
            { _id: groupId },
            {
              [`$${isUserAlreadyAdmin ? "pull" : "push"}`]: {
                admins: adminId,
              },
            }
          );

          await User.updateOne(
            { _id: adminId },
            {
              [`$${isUserAlreadyAdmin ? "pull" : "push"}`]: {
                adminGroup: groupId,
              },
            }
          );

          return {
            message: `admin ${
              isUserAlreadyAdmin ? "removed from" : "added to"
            } the group successfully`,
          };
        },
      });
    },

    joinGroup: async (
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
          const group = (await Group.findById(groupId))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const adminsAndOwner = [...group.admins, group.owner];

          const isMember = (
            user as unknown as { joinedGroups: (typeof Types.ObjectId)[] }
          ).joinedGroups.some((id) => id.toString() === groupId);

          if (isMember) {
            throw new GraphQLError("you are already member in this group", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          if (group.privacy === "members_only") {
            await Group.updateOne({ _id: groupId }, { joinRequests: user._id });

            const notification = {
              content: `${user._id} sent a request to join ${group.name} group`,
              icon: "group",
              url: `/groups/${group._id}`,
            };

            await User.updateMany(
              {
                $or: adminsAndOwner.map((_id) => ({ _id })),
              },
              {
                $push: { notifications: notification },
              }
            );

            // TODO: SEND NOTIFICATION TO ALL ADMINS WITH JOIN REQUEST

            return { message: "your request has been sent to group admins" };
          }

          const newJoinedGroups = (
            await User.findByIdAndUpdate(
              user._id,
              { $push: { joinedGroups: groupId } },
              { new: true }
            ).select("joinedGroups")
          )?._doc;

          if (!newJoinedGroups) {
            throw new GraphQLError(
              "something went wrong while make you a member in this group",
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          await Group.updateOne(
            { _id: groupId },
            {
              $inc: {
                membersCount: 1,
              },
            }
          );

          return {
            message: "you are successfully joined to this group",
            joinedGroups: newJoinedGroups.joinedGroups,
          };
        },
      });
    },
    exitGroup: async (
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
          const group = (await Group.findById(groupId))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isMember = (
            user as unknown as { joinedGroups: (typeof Types.ObjectId)[] }
          ).joinedGroups.some((id) => id.toString() === groupId);

          const isAdmin = (
            user as unknown as { adminGroups: (typeof Types.ObjectId)[] }
          ).adminGroups.some((id) => id.toString() === groupId);

          if (!isMember) {
            throw new GraphQLError("you aren't member in this group already", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          if (group.owner.toString() === user._id) {
            throw new GraphQLError(
              "you can't exit from group because you are the owner"
            );
          }

          const updatedUserData = {
            $pull: { joinedGroups: groupId },
          } as Record<string, unknown>;

          if (isAdmin) {
            updatedUserData.$pull = {
              ...(updatedUserData.$pull as Record<string, unknown>),
              adminGroups: groupId,
            };
          }

          await User.updateOne({ _id: user._id }, updatedUserData); // exit user from group

          const updateGroupMembersCount = Group.updateOne(
            { _id: groupId },
            {
              $inc: {
                membersCount: -1,
              },
            }
          );
          const removeUserProstsFromGroup = Post.deleteMany({
            owner: user._id,
            communityId: group._id,
          });

          await Promise.allSettled([
            updateGroupMembersCount,
            removeUserProstsFromGroup,
          ]);

          return {
            message: "you are successfully exit from the group",
          };
        },
      });
    },

    expulsingFromTheGroup: async (
      _: unknown,
      {
        explusionFromGroupData: { groupId, memberId },
      }: { explusionFromGroupData: Record<"memberId" | "groupId", string> },
      { req }: APIContextFnType
    ) => {
      if (!groupId || !memberId) {
        throw new GraphQLError(
          `${!memberId ? "member" : "group"} id is required`,
          {
            extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
          }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg:
          "something went wrong while try to expulsing member from group",
        async resolveCallback(user) {
          const group = (await Group.findById(groupId))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isAuthUserHasAccess = [...group.admins, group.owner].some(
            (id: typeof Types.ObjectId) => id.toString() === user._id
          );

          if (!isAuthUserHasAccess) {
            throw new GraphQLError(
              "you don't have ability to expulsing members from this group",
              { extensions: { code: "FORBIDDEN" } }
            );
          }

          const member = (await User.findById(memberId))?._doc;

          if (!member) {
            throw new GraphQLError("member with given id not found");
          }

          const isUserAlreadyMember = member.joinedGroups.some(
            (id: typeof Types.ObjectId) => id.toString() === groupId
          );

          if (!isUserAlreadyMember) {
            throw new GraphQLError("user isn't a member in the group", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          const isMemberAdmin = member.adminGroups.some(
            (id: typeof Types.ObjectId) => id.toString() === groupId
          );

          if (isMemberAdmin && group.owner.toString() !== user._id) {
            throw new GraphQLError(
              "group owner only can expulsing admins from the group",
              {
                extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
              }
            );
          }

          if (group.owner.toString() === user._id) {
            throw new GraphQLError(
              "you can't expulsing your self from the group because you are the owner"
            );
          }

          const updatedUserData = {
            $pull: { joinedGroups: groupId },
          } as Record<string, unknown>;

          if (isMemberAdmin) {
            updatedUserData.$pull = {
              ...(updatedUserData.$pull as Record<string, unknown>),
              adminGroups: groupId,
            };
          }

          await User.updateOne({ _id: memberId }, updatedUserData); // expulsing user from group

          const updateGroupMembersCount = Group.updateOne(
            { _id: groupId },
            {
              $inc: {
                membersCount: -1,
              },
            }
          );
          const removeUserProstsFromGroup = Post.deleteMany({
            owner: user._id,
            communityId: groupId,
          });

          await Promise.allSettled([
            updateGroupMembersCount,
            removeUserProstsFromGroup,
          ]);

          User.updateOne(
            { _id: memberId },
            {
              $push: {
                notifications: {
                  icon: "group",
                  caption: `you have been expulsing from ${group.name} Group by one of the group admins`,
                },
              },
            }
          );

          return {
            message: "you are successfully expulsing member from the group",
          };
        },
      });
    },

    handleGroupRequest: async (
      _: unknown,
      {
        handleGroupRequestData: { acception, requestId },
      }: {
        handleGroupRequestData: {
          acception: boolean;
          requestId: string;
        };
      },
      { req }: APIContextFnType
    ) => {
      if (!requestId) {
        throw new GraphQLError("request id is required", {
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
          const group = (await Group.findOne({ joinRequests: requestId }))
            ?._doc;

          if (!group) {
            throw new GraphQLError(
              "group join request with given id not found",
              { extensions: { code: "NOT_FOUND" } }
            );
          }

          const hasAccessToRequests = [...group.admins, group.owner].some(
            (id: typeof Types.ObjectId) => id.toString() === user._id
          );

          if (!hasAccessToRequests) {
            throw new GraphQLError(
              "you don't have access to group join requests",
              { extensions: { code: "FORBIDDEN" } }
            );
          }

          if (acception) {
            await User.updateOne(
              { _id: user._id },
              {
                $push: {
                  joinedGroups: group._id,
                },
              }
            );

            await Group.updateOne(
              { _id: group._id },
              {
                $inc: { membersCount: 1 },
                $pull: { joinRequests: requestId },
              }
            );

            return { message: "request successfully accepted" };
          }

          await Group.updateOne({
            $pull: { joinRequests: requestId },
          });

          return { message: "request has been denied" };
        },
      });
    },
  },
};

export default groupResolvers;
