// gql
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";

// utils
import { Types } from "mongoose";
import handleConnectDB from "@/lib/handleConnectDB";

// models
import Page from "../../../../_models/page.model";
import Post from "../../../../_models/post.model";

// types
import type { APIContextFnType, Pagination, PostType } from "@/lib/types";

const getPagePosts = async (
  _: unknown,
  {
    paginatedPosts: { pageId, limit = 0, page = 1, skip = 0 },
  }: { paginatedPosts: Pagination<{ pageId: string; skip: number }> },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    publicErrorMsg: "something went wrong while getting page posts",
    async resolveCallback(user) {
      const mainSkip = (page - 1) * limit;

      if (!pageId) {
        throw new GraphQLError("page id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      const pageDoc = (
        await Page.findById(pageId).select("name profilePicture")
      )._doc;

      if (!pageDoc) {
        throw new GraphQLError("page with given id not found", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      const posts = await Post.aggregate([
        {
          $match: {
            communityId: new Types.ObjectId(pageId),
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
            _id: pageDoc._id,
            name: pageDoc.name,
            profilePicture: pageDoc.profilePicture,
          },
        })),
        isFinalPage: page * limit >= count,
      };
    },
  });
};

export default getPagePosts;
