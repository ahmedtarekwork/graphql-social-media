// utils
import handleConnectDB from "@/lib/handleConnectDB";
import { Types } from "mongoose";

// types
import type { APIContextFnType, Pagination, PostType } from "@/lib/types";

// models
import User from "../../../../_models/user.model";

const getCurrentUserPosts = async (
  _: unknown,
  {
    paginatedPosts: { page = 1, limit = 0, skip = 0 },
  }: { paginatedPosts: Pagination<{ skip: number }> },
  { req }: APIContextFnType
) => {
  return await handleConnectDB({
    req,
    validateToken: true,
    publicErrorMsg: "something went wrong while getting your posts",
    async resolveCallback(authUser) {
      const mainSkipCount = (page - 1) * limit;

      const posts = await User.aggregate([
        { $match: { _id: new Types.ObjectId(authUser._id) } },

        {
          $facet: {
            userPostsCount: [
              {
                $project: {
                  userPostsCount: {
                    $size: {
                      $filter: {
                        input: "$allPosts",
                        as: "post",
                        cond: { $eq: ["$$post.community", "personal"] },
                      },
                    },
                  },
                },
              },
            ],

            userPosts: [
              { $unwind: "$allPosts" },
              {
                $match: {
                  "allPosts.community": "personal",
                },
              },
              { $sort: { "allPosts.shareDate": -1 } },
              { $skip: mainSkipCount + skip },
              { $limit: limit },

              {
                $lookup: {
                  from: "posts",
                  localField: "allPosts.post",
                  foreignField: "_id",
                  as: "postInfo",
                },
              },

              {
                $unwind: "$postInfo",
              },

              {
                $lookup: {
                  from: "users",
                  localField: "postInfo.owner",
                  foreignField: "_id",
                  as: "postOwner",
                },
              },
              { $unwind: "$postOwner" },

              ...(authUser._id
                ? [
                    {
                      $lookup: {
                        from: "users",
                        let: {
                          authenticatedUserId: new Types.ObjectId(authUser._id),
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
                        "postInfo.isShared": {
                          $cond: {
                            if: {
                              $in: [
                                "$postInfo._id",
                                "$authUserDetails.sharedPosts",
                              ],
                            },
                            then: true,
                            else: false,
                          },
                        },
                        "postInfo.isInBookMark": {
                          $cond: {
                            if: {
                              $in: [
                                "$postInfo._id",
                                "$authUserDetails.savedPosts",
                              ],
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
                        "postInfo.isShared": false,
                        "postInfo.isInBookMark": false,
                      },
                    },
                  ]),

              {
                $project: {
                  _id: 0,
                  postInfo: {
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
                    shareDate: "$allPosts.shareDate",
                    isInBookMark: 1,
                    isShared: 1,
                  },
                },
              },

              {
                $group: {
                  _id: "$_id",
                  allPosts: {
                    $push: "$postInfo",
                  },
                },
              },
            ],
          },
        },
      ]);

      const allPostsCount =
        posts?.[0]?.userPostsCount?.[0]?.userPostsCount || 0;
      const userPosts =
        posts?.[0]?.userPosts?.[0]?.allPosts?.map((post: PostType) => {
          if (post.isShared) {
            return {
              ...post,
              sharePerson: JSON.parse(
                JSON.stringify(authUser, ["_id", "username", "profilePicture"])
              ),
            };
          }

          return post;
        }) || [];

      return {
        posts: userPosts,
        isFinalPage: page * limit >= allPostsCount,
      };
    },
  });
};
export default getCurrentUserPosts;
