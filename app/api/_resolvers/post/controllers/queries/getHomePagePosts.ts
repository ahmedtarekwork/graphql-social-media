// models
import User from "../../../../_models/user.model";
import Post from "../../../../_models/post.model";

// utils
import { Types } from "mongoose";
import handleConnectDB from "@/lib/handleConnectDB";

// types
import type { APIContextFnType, Pagination, PostType } from "@/lib/types";

// gql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

const getHomePagePosts = async (
  _: unknown,
  { paginatedPosts: { page = 1, limit = 0 } }: { paginatedPosts: Pagination },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    publicErrorMsg: "something went wrong while getting the posts",
    validateToken: true,
    req,

    userQuery: (userId) =>
      User.findById(userId).select("followedPages joinedGroups friendsList"),

    async resolveCallback(returnedUser) {
      const user = returnedUser as unknown as Record<
        "followedPages" | "joinedGroups" | "friendsList",
        (typeof Types.ObjectId)[]
      > & { _id: string };

      const posts = await Post.aggregate([
        {
          $match: {
            $or: [
              {
                community: "page",
                communityId: { $in: user.followedPages },
              },
              {
                community: "group",
                communityId: { $in: user.joinedGroups },
              },
              {
                owner: { $in: user.friendsList },
                privacy: { $in: ["public", "friends_only"] },
                community: "personal",
              },
            ],
          },
        },

        {
          $facet: {
            metadata: [{ $count: "total" }],

            posts: [
              { $sort: { createdAt: -1 } },
              { $skip: (page - 1) * limit },
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

              {
                $lookup: {
                  from: "pages",
                  localField: "communityId",
                  foreignField: "_id",
                  as: "pageCommunity",
                },
              },
              {
                $unwind: {
                  path: "$pageCommunity",
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $lookup: {
                  from: "groups",
                  localField: "communityId",
                  foreignField: "_id",
                  as: "groupCommunity",
                },
              },
              {
                $unwind: {
                  path: "$groupCommunity",
                  preserveNullAndEmptyArrays: true,
                },
              },

              ...(returnedUser._id
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
                  media: 1,
                  owner: {
                    _id: "$postOwner._id",
                    username: "$postOwner.username",
                    profilePicture: "$postOwner.profilePicture",
                  },
                  commentsCount: 1,
                  blockComments: 1,
                  privacy: 1,
                  community: 1,
                  communityId: 1,
                  shareData: { count: 1 },
                  shareDate: "$createdAt",
                  isInBookMark: 1,
                  isShared: 1,
                  pageCommunity: {
                    _id: "$pageCommunity._id",
                    name: "$pageCommunity.name",
                    profilePicture: "$pageCommunity.profilePicture",
                  },
                  groupCommunity: {
                    _id: "$groupCommunity._id",
                    name: "$groupCommunity.name",
                    profilePicture: "$groupCommunity.profilePicture",
                  },
                },
              },
            ],
          },
        },
      ]);

      if (!posts) {
        throw new GraphQLError("can't get posts at the momment", {
          extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
        });
      }

      const count = posts?.[0]?.metadata?.[0]?.total;

      return {
        isFinalPage: page * limit >= count || 0,
        posts: (posts?.[0]?.posts || []).map(
          (post: PostType & Record<string, unknown>) => {
            const communityInfo = {} as Record<string, unknown>;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let data: any;
            if (post.community === "page") data = post.pageCommunity;
            else if (post.community === "group") data = post.groupCommunity;

            if (data) {
              communityInfo.communityInfo = {
                _id: data._id,
                name: data.name,
                profilePicture: data.profilePicture,
              };
            }

            return {
              ...Object.fromEntries(
                Object.entries(post).filter(
                  ([key]) => !["pageCommunity", "groupCommunity"].includes(key)
                )
              ),
              ...communityInfo,
            };
          }
        ),
      };
    },
  });
};

export default getHomePagePosts;
