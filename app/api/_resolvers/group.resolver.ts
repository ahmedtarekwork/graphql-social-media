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
import type {
  APIContextFnType,
  Pagination,
  PostType,
  GroupInputDataType,
} from "@/lib/types";

const groupResolvers = {
  Query: {
    getExploreGroups: async (
      _: unknown,
      { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting available groups",
        req,
        validateToken: true,
        async resolveCallback(user) {
          const groupsResult = await Group.aggregate([
            {
              $lookup: {
                from: "users",
                let: {
                  authenticatedUserId: new Types.ObjectId(user._id),
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", "$$authenticatedUserId"],
                      },
                    },
                  },
                  {
                    $project: {
                      joinedGroups: { $ifNull: ["$joinedGroups", []] },
                      adminGroups: { $ifNull: ["$adminGroups", []] },
                      ownedGroups: { $ifNull: ["$ownedGroups", []] },
                    },
                  },
                ],
                as: "authUserDetails",
              },
            },
            { $unwind: "$authUserDetails" },

            {
              $match: {
                $expr: {
                  $not: {
                    $or: [
                      { $in: ["$_id", "$authUserDetails.joinedGroups"] },
                      { $in: ["$_id", "$authUserDetails.adminGroups"] },
                      { $in: ["$_id", "$authUserDetails.ownedGroups"] },
                    ],
                  },
                },
              },
            },

            {
              $facet: {
                metadata: [{ $count: "total" }],

                groups: [
                  { $limit: limit },
                  { $skip: (page - 1) * limit },

                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      profilePicture: 1,
                      membersCount: 1,
                    },
                  },
                ],
              },
            },
          ]);

          const groups = groupsResult?.[0]?.groups || [];
          const count = groupsResult?.[0]?.metadata?.[0]?.total || 0;

          return { groups, isFinalPage: page * limit >= count };
        },
      }),

    getJoinedGroups: async (
      _: unknown,
      { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting your joined groups",
        req,
        validateToken: true,
        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                groupsCount: [
                  {
                    $project: {
                      groupsCount: {
                        $size: { $ifNull: ["$joinedGroups", []] },
                      },
                    },
                  },
                ],

                groups: [
                  { $unwind: "$joinedGroups" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "groups",
                      localField: "joinedGroups",
                      foreignField: "_id",
                      as: "groupInfo",
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      groupInfo: {
                        _id: 1,
                        name: 1,
                        profilePicture: 1,
                        membersCount: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      groups: {
                        $push: "$groupInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          return {
            groups: result?.[0]?.groups?.[0]?.groups?.[0] || [],
            isFinalPage:
              page * limit >= result?.[0]?.groupsCount?.[0]?.groupsCount || 0,
          };
        },
      }),
    getAdminGroups: async (
      _: unknown,
      { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting your admin groups",
        req,
        validateToken: true,
        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                groupsCount: [
                  {
                    $project: {
                      groupsCount: {
                        $size: { $ifNull: ["$adminGroups", []] },
                      },
                    },
                  },
                ],

                groups: [
                  { $unwind: "$adminGroups" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "groups",
                      localField: "adminGroups",
                      foreignField: "_id",
                      as: "groupInfo",
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      groupInfo: {
                        _id: 1,
                        name: 1,
                        profilePicture: 1,
                        membersCount: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      groups: {
                        $push: "$groupInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          return {
            groups: result?.[0]?.groups?.[0]?.groups?.[0] || [],
            isFinalPage:
              page * limit >= result?.[0]?.groupsCount?.[0]?.groupsCount || 0,
          };
        },
      }),
    getOwnedGroups: async (
      _: unknown,
      { pagination: { page = 1, limit = 0 } }: { pagination: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting your owned groups",
        req,
        validateToken: true,
        async resolveCallback(user) {
          const result = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $facet: {
                groupsCount: [
                  {
                    $project: {
                      groupsCount: {
                        $size: { $ifNull: ["$ownedGroups", []] },
                      },
                    },
                  },
                ],

                groups: [
                  { $unwind: "$ownedGroups" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "groups",
                      localField: "ownedGroups",
                      foreignField: "_id",
                      as: "groupInfo",
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      groupInfo: {
                        _id: 1,
                        name: 1,
                        profilePicture: 1,
                        membersCount: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      groups: {
                        $push: "$groupInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          return {
            groups: result?.[0]?.groups?.[0]?.groups?.[0] || [],
            isFinalPage:
              page * limit >= result?.[0]?.groupsCount?.[0]?.groupsCount || 0,
          };
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
          const group = (await Group.findById(groupId))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          return { ...group, owner: { _id: group.owner } };
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
          const group = (await Group.findById(groupId).select("owner"))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAdminInGroup = (
            await Group.aggregate([
              { $match: { _id: new Types.ObjectId(groupId) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ])
          )?.[0]?.isUserAdminInGroup;

          if (
            !isUserAdminInGroup ||
            user._id.toString() !== group.owner.toString()
          ) {
            throw new GraphQLError("you don't have access to this data", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          const result = await Group.aggregate([
            { $match: { _id: new Types.ObjectId(groupId) } },
            {
              $project: {
                joinRequests: 1,
                totalCount: { $size: "$joinRequests" },
              },
            },
            { $unwind: "$joinRequests" },

            {
              $lookup: {
                from: "users",
                let: { userId: "$joinRequests.user" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                  { $project: { _id: 1, username: 1, profilePicture: 1 } },
                ],
                as: "joinRequests.user",
              },
            },

            { $unwind: "$joinRequests.user" },
            { $replaceRoot: { newRoot: "$joinRequests" } },
            {
              $facet: {
                data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
              },
            },
            {
              $project: {
                data: 1,
                totalCount: 1,
              },
            },
          ]);

          const joinRequests = result[0]?.data || [];
          const totalCount = result[0]?.totalCount || 0;

          return {
            requests: joinRequests,
            isFinalPage: page * limit > totalCount,
          };
        },
      });
    },

    getGroupPosts: async (
      _: unknown,
      {
        paginatedPosts: { groupId, limit = 0, page = 1, skip = 0 },
      }: { paginatedPosts: Pagination<{ groupId: string; skip: number }> },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while getting this group posts",
        async resolveCallback(user) {
          const mainSkip = (page - 1) * limit;

          if (!groupId) {
            throw new GraphQLError("group id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const groupDoc = (
            await Group.findById(groupId).select(
              "name profilePicture privacy owner"
            )
          )._doc;

          if (!groupDoc) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          if (groupDoc.privacy === "members_only") {
            const isUserMemberInGroupPromise = User.aggregate([
              { $match: { _id: new Types.ObjectId(user._id) } },
              {
                $project: {
                  isUserMemberInGroup: {
                    $in: [new Types.ObjectId(groupId), "$joinedGroups"],
                  },
                },
              },
              { $match: { isUserMemberInGroup: true } },
            ]);

            const isUserAdminInGroupPromise = Group.aggregate([
              { $match: { _id: new Types.ObjectId(groupId) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ]);

            const [isUserAdminInGroupRes, isUserMemberInGroupRes] =
              await Promise.allSettled([
                isUserAdminInGroupPromise,
                isUserMemberInGroupPromise,
              ]);

            const isUserAdminInGroup =
              isUserAdminInGroupRes.status === "fulfilled"
                ? isUserAdminInGroupRes.value?.[0]?.isUserAdminInGroup
                : false;

            const isUserMemberInGroup =
              isUserMemberInGroupRes.status === "fulfilled"
                ? isUserMemberInGroupRes.value?.[0]?.isUserMemberInGroup
                : false;

            if (
              !isUserMemberInGroup ||
              !isUserAdminInGroup ||
              groupDoc.owner.toString() !== user._id.toString()
            ) {
              throw new GraphQLError(
                "you must be a owner or member or admin in this group to see it's posts"
              );
            }
          }

          const posts = await Post.aggregate([
            {
              $match: {
                communityId: new Types.ObjectId(groupId),
              },
            },
            {
              $facet: {
                metadata: [{ $count: "total" }],

                posts: [
                  { $sort: { createdAt: -1 } },
                  { $skip: mainSkip - skip < 0 ? 0 : mainSkip - skip },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "users",
                      localField: "owner",
                      foreignField: "_id",
                      as: "postOwner",
                    },
                  },
                  { $unwind: "$postOwner" },

                  ...(user?._id
                    ? [
                        {
                          $lookup: {
                            from: "users",
                            let: {
                              authenticatedUserId: new Types.ObjectId(user._id),
                            },
                            pipeline: [
                              {
                                $match: {
                                  $expr: {
                                    $eq: ["$_id", "$$authenticatedUserId"],
                                  },
                                },
                              },
                              { $project: { sharedPosts: 1, savedPosts: 1 } },
                            ],
                            as: "authUserDetails",
                          },
                        },
                        { $unwind: "$authUserDetails" },

                        {
                          $addFields: {
                            isShared: {
                              $cond: {
                                if: {
                                  $in: ["$_id", "$authUserDetails.sharedPosts"],
                                },
                                then: true,
                                else: false,
                              },
                            },
                            isInBookMark: {
                              $cond: {
                                if: {
                                  $in: ["$_id", "$authUserDetails.savedPosts"],
                                },
                                then: true,
                                else: false,
                              },
                            },
                          },
                        },
                      ]
                    : []),

                  {
                    $project: {
                      _id: 1,
                      caption: 1,
                      reactions: {
                        like: { count: 1 },
                        love: { count: 1 },
                        sad: { count: 1 },
                        angry: { count: 1 },
                      },
                      owner: {
                        _id: "$postOwner._id",
                        username: "$postOwner.username",
                        profilePicture: "$postOwner.profilePicture",
                      },
                      media: 1,
                      commentsCount: 1,
                      blockComments: 1,
                      privacy: 1,
                      community: 1,
                      communityId: 1,
                      shareData: { count: 1 },
                      shareDate: "$createdAt",
                      isInBookMark: user?._id ? 1 : false,
                      isShared: user?._id ? 1 : false,
                    },
                  },
                ],
              },
            },
          ]);

          const count = posts?.[0]?.metadata?.[0]?.total;

          return {
            posts: (posts?.[0]?.posts || []).map((post: PostType) => ({
              ...post,
              communityInfo: {
                _id: groupDoc._id,
                name: groupDoc.name,
                profilePicture: groupDoc.profilePicture,
              },
            })),
            isFinalPage: page * limit >= count,
          };
        },
      }),

    getGroupAdminsList: async (
      _: unknown,
      {
        paginationData: { groupId, limit = 0, page = 1, skip = 0 },
      }: { paginationData: Pagination<{ groupId: string; skip: number }> },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        validateToken: true,
        req,
        publicErrorMsg: "something went wrong while getting group admins list",
        async resolveCallback(user) {
          const mainSkipCount = (page - 1) * limit;

          if (!groupId) {
            throw new GraphQLError("group id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const groupDoc = await Group.findById(groupId).select("owner");

          if (!groupDoc) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAdminInGroup = (
            await Group.aggregate([
              { $match: { _id: new Types.ObjectId(groupId) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ])
          )?.[0]?.isUserAdminInGroup;

          if (
            groupDoc.owner.toString() !== user._id.toString() &&
            !isUserAdminInGroup
          ) {
            throw new GraphQLError(
              "group owner or admins can only the admins list of page",
              { extensions: { code: "FORBIDDEN" } }
            );
          }

          const adminsList = await Group.aggregate([
            { $match: { _id: new Types.ObjectId(groupId) } },
            {
              $facet: {
                adminsCount: [
                  {
                    $project: {
                      adminsCount: {
                        $size: "$admins",
                      },
                    },
                  },
                ],

                admins: [
                  { $unwind: "$admins" },
                  {
                    $skip: mainSkipCount + skip < 0 ? 0 : mainSkipCount + skip,
                  },
                  { $limit: limit },

                  {
                    $lookup: {
                      from: "users",
                      localField: "admins",
                      foreignField: "_id",
                      as: "adminInfo",
                    },
                  },

                  {
                    $unwind: "$adminInfo",
                  },

                  {
                    $project: {
                      _id: 0,
                      adminInfo: {
                        _id: 1,
                        username: 1,
                        profilePicture: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      admins: {
                        $push: "$adminInfo",
                      },
                    },
                  },
                ],
              },
            },
          ]);

          const adminsCount =
            adminsList?.[0]?.adminsCount?.[0]?.adminsCount || 0;
          const admins = adminsList?.[0]?.admins?.[0]?.admins || [];

          return {
            admins,
            isFinalPage: page * limit >= adminsCount,
          };
        },
      }),

    isUserMemberInGroup: async (
      _: unknown,
      { groupId }: { groupId: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
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

          const isUserMemberInGroup = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $project: {
                isUserMemberInGroup: {
                  $in: [new Types.ObjectId(groupId), "$joinedGroups"],
                },
              },
            },
            { $match: { isUserMemberInGroup: true } },
          ]);

          return {
            isUserMemberInGroup:
              !!isUserMemberInGroup?.[0]?.isUserMemberInGroup,
          };
        },
      }),

    isUserAdminInGroup: async (
      _: unknown,
      { groupId }: { groupId: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
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

          const isUserAdminInGroup = await Group.aggregate([
            { $match: { _id: new Types.ObjectId(groupId) } },
            {
              $project: {
                isUserAdminInGroup: {
                  $in: [new Types.ObjectId(user._id), "$admins"],
                },
              },
            },
            { $match: { isUserAdminInGroup: true } },
          ]);

          return {
            isUserAdminInGroup: !!isUserAdminInGroup?.[0]?.isUserAdminInGroup,
          };
        },
      }),
  },

  Mutation: {
    addGroup: async (
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
      }: { editGroupData: GroupInputDataType & { groupId: string } },
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
          const group = (await Group.findById(groupId).select("owner name"))
            ?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAdminInGroup = (
            await Group.aggregate([
              { $match: { _id: new Types.ObjectId(groupId) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ])
          )?.[0]?.isUserAdminInGroup;

          if (group.owner.toString() !== user._id || !isUserAdminInGroup) {
            throw new GraphQLError(
              "group owner or admins can only edit group info",
              {
                extensions: { code: "FORBIDDEN" },
              }
            );
          }

          if ("name" in newGroupData && newGroupData.name === group.name) {
            throw new GraphQLError(
              "you can't update group name with same value",
              { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
            );
          }

          await Group.updateOne({ _id: groupId }, newGroupData);

          return { message: "group info updated successfully" };
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
        publicErrorMsg: "something went wrong while deleting the group",
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

          // TODO: REMOVE POSTS WITH IT'S MEDIA
          // TODO: REMOVE COMMENTS WITH IT'S MEDIA

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
        toggleGroupAdminData: { adminId, groupId, toggle },
      }: {
        toggleGroupAdminData: Record<"adminId" | "groupId", string> & {
          toggle: "add" | "remove";
        };
      },
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
        publicErrorMsg: `something went wrong while ${toggle} admin ${
          toggle === "add" ? "to" : "from"
        } group`,
        async resolveCallback(user) {
          const group = (await Group.findById(groupId).select("owner"))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserAdminInGroup = (
            await Group.aggregate([
              { $match: { _id: new Types.ObjectId(groupId) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ])
          )?.[0]?.isUserAdminInGroup;

          if (
            adminId === user._id &&
            isUserAdminInGroup &&
            toggle === "remove"
          ) {
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
              "group owner can only modify admins list of the group",
              {
                extensions: { code: "FORBIDDEN" },
              }
            );
          }

          if (toggle === "remove" && !isUserAdminInGroup) {
            throw new GraphQLError(
              "this user not in admins list of the group",
              { extensions: { code: ApolloServerErrorCode.BAD_REQUEST } }
            );
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
                admins: adminId,
              },
            }
          );

          await User.updateOne(
            { _id: adminId },
            {
              [`$${isUserAdminInGroup ? "pull" : "push"}`]: {
                adminGroup: groupId,
              },
            }
          );

          return {
            message: `admin ${
              isUserAdminInGroup ? "removed from" : "added to"
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
          const group = (await Group.findById(groupId).select("owner privacy"))
            ?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserMemberInGroup = (
            await User.aggregate([
              { $match: { _id: new Types.ObjectId(user._id) } },
              {
                $project: {
                  isUserMemberInGroup: {
                    $in: [new Types.ObjectId(groupId), "$joinedGroups"],
                  },
                },
              },
              { $match: { isUserMemberInGroup: true } },
            ])
          )?.[0]?.isUserMemberInGroup;

          if (isUserMemberInGroup) {
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

          await Group.updateOne(
            { _id: groupId },
            { $inc: { membersCount: 1 } }
          );

          return {
            message: "you are successfully joined to this group",
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
          const group = (await Group.findById(groupId).select("owner"))?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isUserMemberInGroup = (
            await User.aggregate([
              { $match: { _id: new Types.ObjectId(user._id) } },
              {
                $project: {
                  isUserMemberInGroup: {
                    $in: [new Types.ObjectId(groupId), "$joinedGroups"],
                  },
                },
              },
              { $match: { isUserMemberInGroup: true } },
            ])
          )?.[0]?.isUserMemberInGroup;

          if (!isUserMemberInGroup) {
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

          await User.updateOne({ _id: user._id }, updatedUserData); // exit user from group

          // TODO: REMOVE POSTS MEDIA
          // TODO: REMOVE USER POSTS COMMENTS + MEDIA
          // TODO: REMOVE USER ITSELF COMMENTS TO OTHER USERS POSTS + MEDIA

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
          const group = (await Group.findById(groupId).select("name owner"))
            ?._doc;

          if (!group) {
            throw new GraphQLError("group with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          const isAuthUserAdminInGroup = (
            await Group.aggregate([
              { $match: { _id: new Types.ObjectId(groupId) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ])
          )?.[0]?.isUserAdminInGroup;

          if (
            !isAuthUserAdminInGroup &&
            group.owner.toString() !== user._id.toString()
          ) {
            throw new GraphQLError(
              "you don't have ability to expulsing members from this group",
              { extensions: { code: "FORBIDDEN" } }
            );
          }

          const isMemberIsActuallyMemberInGroup = (
            await Group.aggregate([
              { $match: { _id: new Types.ObjectId(groupId) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ])
          )?.[0]?.isUserAdminInGroup;

          if (!isMemberIsActuallyMemberInGroup) {
            throw new GraphQLError("user isn't a member in the group", {
              extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
            });
          }

          const isMemberAdminInGroup = (
            await Group.aggregate([
              { $match: { _id: new Types.ObjectId(groupId) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ])
          )?.[0]?.isUserAdminInGroup;

          if (isMemberAdminInGroup && group.owner.toString() !== user._id) {
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

          if (isMemberAdminInGroup) {
            updatedUserData.$pull = {
              ...(updatedUserData.$pull as Record<string, unknown>),
              adminGroups: groupId,
            };
          }

          await User.updateOne({ _id: memberId }, updatedUserData); // expulsing user from group

          // TODO: REMOVE MEMBER POSTS Media
          // TODO: REMOVE MEMBER POSTS OTHER USERS COMMENTS + COMMENTS Media
          // TODO: REMOVE MEMBER HIMSELF COMMENTS + COMMENTS Media

          const updateGroupMembersCount = Group.updateOne(
            { _id: groupId },
            {
              $inc: {
                membersCount: -1,
              },
            }
          );
          const removeUserProstsFromGroup = Post.deleteMany({
            owner: memberId,
            communityId: groupId,
          });

          const sendNotificationToMember = User.updateOne(
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

          await Promise.allSettled([
            updateGroupMembersCount,
            removeUserProstsFromGroup,
            sendNotificationToMember,
          ]);

          return {
            message: "you are successfully expulsing the member from the group",
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
          const group = (
            await Group.findOne({ $elemMatch: { _id: requestId } }).select(
              "owner"
            )
          )?._doc;

          if (!group) {
            throw new GraphQLError(
              "there is no group has join request with given id",
              { extensions: { code: "NOT_FOUND" } }
            );
          }

          const isAuthUserAdminInGroup = (
            await Group.aggregate([
              { $match: { _id: new Types.ObjectId(group._id) } },
              {
                $project: {
                  isUserAdminInGroup: {
                    $in: [new Types.ObjectId(user._id), "$admins"],
                  },
                },
              },
              { $match: { isUserAdminInGroup: true } },
            ])
          )?.[0]?.isUserAdminInGroup;

          if (
            !isAuthUserAdminInGroup &&
            group.owner.toString() !== user._id.toString()
          ) {
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
          }

          const newGroupInfo: Record<string, unknown> = {
            $pull: { joinRequests: requestId },
          };

          if (acception) newGroupInfo.$inc = { membersCount: 1 };

          await Group.updateOne({ _id: group._id }, newGroupInfo);

          return {
            message: acception
              ? "request successfully accepted"
              : "request has been denied successfully",
          };
        },
      });
    },
  },
};

export default groupResolvers;
