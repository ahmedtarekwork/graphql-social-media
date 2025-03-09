// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";
import isUserAdminInGroupFn from "../../utils/isUserAdminInGroup";
import isUserMemberInGroupFn from "../../utils/isUserMemberInGroup";

// types
import type { APIContextFnType, Pagination, PostType } from "@/lib/types";

// models
import Group from "../../../../_models/group.model";
import Post from "../../../../_models/post.model";

const getGroupPosts = async (
  _: unknown,
  {
    paginatedPosts: { groupId, limit = 0, page = 1, skip = 0 },
  }: { paginatedPosts: Pagination<{ groupId: string; skip: number }> },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
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
        const isUserMemberInGroupPromise = () =>
          isUserMemberInGroupFn(user._id, groupId);

        const isUserAdminInGroupPromise = () =>
          isUserAdminInGroupFn(user._id, groupId);

        const [isUserAdminInGroupRes, isUserMemberInGroupRes] =
          await Promise.allSettled([
            isUserAdminInGroupPromise(),
            isUserMemberInGroupPromise(),
          ]);

        const isUserAdminInGroup =
          isUserAdminInGroupRes.status === "fulfilled"
            ? isUserAdminInGroupRes.value
            : false;

        const isUserMemberInGroup =
          isUserMemberInGroupRes.status === "fulfilled"
            ? isUserMemberInGroupRes.value
            : false;

        if (
          !isUserMemberInGroup &&
          !isUserAdminInGroup &&
          groupDoc.owner.toString() !== user._id.toString()
        ) {
          throw new GraphQLError(
            "you must be an owner or member or admin in this group to see it's posts"
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
                : [
                    {
                      $addFields: {
                        isShared: false,
                        isInBookMark: false,
                      },
                    },
                  ]),

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
                  isInBookMark: 1,
                  isShared: 1,
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
  });
};

export default getGroupPosts;
