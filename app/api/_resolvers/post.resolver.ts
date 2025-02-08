// graphql
import { GraphQLError } from "graphql";
import { ApolloServerErrorCode } from "@apollo/server/errors";

// utils
import handleConnectDB from "@/lib/handleConnectDB";
import validateToken from "@/lib/validateToken";
import checkForPostPrivacy from "@/lib/checkForPostPrivacy";
import { deleteMedia } from "@/lib/utils";
import { Types } from "mongoose";

// models
import Post from "../_models/post.model";
import User from "../_models/user.model";
import Comment from "../_models/comment.model";
import Page from "../_models/page.model";
import Group from "../_models/group.model";

// types
import type {
  APIContextFnType,
  ImageType,
  Pagination,
  PostType,
  ReactionsType,
} from "@/lib/types";

const postResolvers = {
  Query: {
    getHomePagePosts: async (
      _: unknown,
      {
        paginatedPosts: { page = 1, limit = 0 },
      }: { paginatedPosts: Pagination },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        publicErrorMsg: "something went wrong while getting the posts",
        validateToken: true,
        req,

        userQuery: (userId) =>
          User.findById(userId).select(
            "followedPages joinedGroups friendsList"
          ),

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
            isFinalPage: (page - 1) * limit >= count || 0,
            posts: posts?.[0]?.posts || [],
          };
        },
      }),

    getCurrentUserPosts: async (
      _: unknown,
      {
        paginatedPosts: { page = 1, limit = 0, skip = 0 },
      }: { paginatedPosts: Pagination<{ skip: number }> },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
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
                        $size: "$allPosts",
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

                  {
                    $addFields: {
                      "postInfo.isShared": {
                        $cond: {
                          if: {
                            $in: ["$postInfo._id", "$postOwner.sharedPosts"],
                          },
                          then: true,
                          else: false,
                        },
                      },
                    },
                  },

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
          const userPosts = posts?.[0]?.userPosts?.[0]?.allPosts || [];

          return {
            posts: userPosts,
            isFinalPage: page * limit >= allPostsCount,
          };
        },
      }),

    getSingleUserPosts: async (
      _: unknown,
      {
        paginatedPosts: { page = 1, limit = 0, skip = 0, userId },
      }: { paginatedPosts: Pagination<{ userId: string; skip: number }> },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        publicErrorMsg: "something went wrong while getting your posts",
        async resolveCallback(user) {
          const privacyFilter = ["public"];

          const isCurrentUser = await validateToken(req, (userId) =>
            User.findById(userId).select("_id")
          );

          if (isCurrentUser) {
            const isCurrentUserFriendWithProfileOwner = await User.aggregate([
              { $match: { _id: new Types.ObjectId(isCurrentUser._id) } },
              {
                $project: {
                  isCurrentUserFriendWithProfileOwner: {
                    $in: [new Types.ObjectId(userId), "$friendsList"],
                  },
                },
              },
              { $match: { isCurrentUserFriendWithProfileOwner: true } },
            ]);

            if (
              isCurrentUserFriendWithProfileOwner?.[0]
                ?.isCurrentUserFriendWithProfileOwner
            ) {
              privacyFilter.push("friends_only");
            }
          }

          const mainSkipCount = (page - 1) * limit;

          const posts = await User.aggregate([
            { $match: { _id: new Types.ObjectId(userId) } },

            {
              $facet: {
                userPostsCount: [
                  {
                    $project: {
                      userPostsCount: {
                        $size: "$allPosts",
                      },
                    },
                  },
                ],

                userPosts: [
                  { $unwind: "$allPosts" },
                  {
                    $match: {
                      $and: [
                        { "allPosts.privacy": { $in: privacyFilter } },
                        { "allPosts.community": "personal" },
                      ],
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
                    : []),

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
                        isInBookMark: user?._id ? 1 : false,
                        isShared: user?._id ? 1 : false,
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
          const userPosts = posts?.[0]?.userPosts?.[0]?.allPosts || [];

          return {
            posts: userPosts,
            isFinalPage: page * limit >= allPostsCount,
          };
        },
      }),

    getSinglePost: async (
      _: unknown,
      { postId }: { postId: string },
      { req }: APIContextFnType
    ) =>
      await handleConnectDB({
        req,
        publicErrorMsg: "something went wrong while getting the post",
        async resolveCallback(user) {
          const post = (await Post.findById(postId)
            .populate({
              path: "owner",
              select: "username _id profilePicture",
            })
            .lean()
            .select({
              "shareData.count": 1,
              "reactions.like.count": 1,
              "reactions.love.count": 1,
              "reactions.sad.count": 1,
              "reactions.angry.count": 1,
              caption: 1,
              commentsCount: 1,
              blockComments: 1,
              media: 1,
              privacy: 1,
              community: 1,
              createdAt: 1,
            })) as PostType;

          if (!post) {
            throw new GraphQLError("This post not found", {
              extensions: {
                code: "NOT_FOUND",
              },
            });
          }

          switch (post.privacy) {
            case "friends_only": {
              const isPostOwnerMyFriendRequest = await User.aggregate([
                { $match: { _id: new Types.ObjectId(user?._id) } },
                {
                  $project: {
                    isPostOwnerMyFriend: {
                      $in: [
                        new Types.ObjectId(post.owner as unknown as string),
                        "$friendsList",
                      ],
                    },
                  },
                },
                { $match: { isPostOwnerMyFriend: true } },
              ]);

              if (
                !isPostOwnerMyFriendRequest?.[0]?.isPostOwnerMyFriend &&
                post.owner.toString() !== user?._id
              ) {
                throw new GraphQLError(
                  "this post available to post owner friends only",
                  { extensions: { code: "FORBIDDEN" } }
                );
              }
            }
            case "only_me": {
              if (user?._id !== post.owner.toString()) {
                throw new GraphQLError(
                  "this post available for post owner only",
                  { extensions: { code: "FORBIDDEN" } }
                );
              }
            }
          }

          const result = user?._id
            ? await User.aggregate([
                { $match: { _id: new Types.ObjectId(user._id) } },
                {
                  $facet: {
                    isShared: [
                      {
                        $project: {
                          isShared: {
                            $in: [new Types.ObjectId(postId), "$sharedPosts"],
                          },
                        },
                      },
                      { $match: { isShared: true } },
                    ],
                    isInBookMark: [
                      {
                        $project: {
                          isInBookMark: {
                            $in: [new Types.ObjectId(postId), "$savedPosts"],
                          },
                        },
                      },
                      { $match: { isInBookMark: true } },
                    ],
                  },
                },
              ])
            : undefined;

          return {
            ...post,
            isShared: !!result?.[0]?.isShared?.[0]?.isShared,
            isInBookMark: !!result?.[0]?.isInBookMark?.[0]?.isInBookMark,
            shareDate: (post as unknown as { createdAt: string }).createdAt,
          };
        },
      }),

    getPostSharesUsers: async (
      _: unknown,
      {
        sharesInfo: { postId, limit = 0, page = 1 },
      }: { sharesInfo: Pagination<{ postId: string }> }
    ) => {
      return await handleConnectDB({
        publicErrorMsg: "can't get post shares at the momment",
        async resolveCallback() {
          if (!postId) {
            throw new GraphQLError("post id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const result = await Post.aggregate([
            { $match: { _id: new Types.ObjectId(postId) } },
            {
              $facet: {
                sharedCount: [
                  {
                    $project: {
                      sharedCount: {
                        $size: "$shareData.users",
                      },
                    },
                  },
                ],

                shares: [
                  { $unwind: "$shareData.users" },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },
                  {
                    $lookup: {
                      from: "users",
                      localField: "shareData.users",
                      foreignField: "_id",
                      as: "userInfo",
                    },
                  },

                  {
                    $unwind: "$userInfo",
                  },

                  {
                    $project: {
                      _id: 0,
                      userInfo: {
                        _id: 1,
                        username: 1,
                        profilePicture: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      shares: { $push: "$userInfo" },
                    },
                  },
                ],
              },
            },
          ]);

          const shares = result?.[0]?.shares?.[0]?.shares || [];

          const sharesCount = result?.[0]?.sharesCount?.[0]?.sharesCount || 0;

          return {
            isFinalPage: page * limit >= sharesCount,
            shares,
          };
        },
      });
    },

    getPostReactions: async (
      _: unknown,
      {
        reactionsInfo: { postId, limit = 0, page = 1, reaction = "like" },
      }: {
        reactionsInfo: Pagination<{
          postId: string;
          reaction: keyof ReactionsType;
        }>;
      }
    ) => {
      return await handleConnectDB({
        publicErrorMsg: "can't get post reactions at the momment",
        async resolveCallback() {
          if (!postId) {
            throw new GraphQLError("post id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const result = await Post.aggregate([
            { $match: { _id: new Types.ObjectId(postId) } },
            {
              $facet: {
                reactionsCount: [
                  {
                    $project: {
                      reactionsCount: {
                        $size: `$reactions.${reaction}.users`,
                      },
                    },
                  },
                ],

                reactions: [
                  { $unwind: `$reactions.${reaction}.users` },
                  { $skip: (page - 1) * limit },
                  { $limit: limit },
                  {
                    $lookup: {
                      from: "users",
                      localField: `reactions.${reaction}.users`,
                      foreignField: "_id",
                      as: "userInfo",
                    },
                  },

                  {
                    $unwind: "$userInfo",
                  },

                  {
                    $project: {
                      _id: 0,
                      userInfo: {
                        _id: 1,
                        username: 1,
                        profilePicture: 1,
                      },
                    },
                  },

                  {
                    $group: {
                      _id: "$_id",
                      reactions: { $push: "$userInfo" },
                    },
                  },
                ],
              },
            },
          ]);

          const reactions = result?.[0]?.reactions?.[0]?.reactions || [];

          console.log("_REACTIONS_", reactions);

          const reactionsCount =
            result?.[0]?.reactionsCount?.[0]?.reactionsCount || 0;

          return {
            isFinalPage: page * limit >= reactionsCount,
            reactions,
          };
        },
      });
    },

    getMyReactionToPost: async (
      _: unknown,
      { postId }: { postId: string },
      { req }: APIContextFnType
    ) => {
      return await handleConnectDB({
        publicErrorMsg: "can't get your reaction to this post at the momment",
        validateToken: true,
        req,
        async resolveCallback(user) {
          if (!postId) {
            throw new GraphQLError("post id is required", {
              extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
            });
          }

          const result = await Post.aggregate([
            { $match: { _id: new Types.ObjectId(postId) } },
            {
              $facet: {
                like: [
                  {
                    $project: {
                      like: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.like.users",
                        ],
                      },
                    },
                  },
                  { $match: { like: true } },
                ],
                love: [
                  {
                    $project: {
                      love: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.love.users",
                        ],
                      },
                    },
                  },
                  { $match: { love: true } },
                ],
                sad: [
                  {
                    $project: {
                      sad: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.sad.users",
                        ],
                      },
                    },
                  },
                  { $match: { sad: true } },
                ],
                angry: [
                  {
                    $project: {
                      angry: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.angry.users",
                        ],
                      },
                    },
                  },
                  { $match: { angry: true } },
                ],
              },
            },
          ]);

          return {
            reaction: Object.entries(result?.[0]).find(([key, value]) => {
              return (value as Record<string, unknown>[])?.[0]?.[key];
            })?.[0],
          };
        },
      });
    },
  },

  Mutation: {
    addPost: async (
      _: unknown,
      {
        postData,
      }: {
        postData: Pick<
          PostType,
          "caption" | "media" | "privacy" | "blockComments" | "community"
        > & { communityId: string };
      },
      { req }: APIContextFnType
    ) => {
      if (!postData.caption && !postData.media?.length) {
        throw new GraphQLError("post must have caption or media", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if ("community" in postData) {
        if (!["page", "group", "personal"].includes(postData.community)) {
          throw new GraphQLError(
            "community must be one of this values only [page, group, personal]",
            { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
          );
        }

        if (postData.community !== "personal" && !("communityId" in postData)) {
          throw new GraphQLError(
            `${(postData as { community: string }).community} id is required`,
            { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
          );
        }
      }

      if (
        "privacy" in postData &&
        !["friends_only", "public", "only_me"].includes(postData.privacy)
      ) {
        throw new GraphQLError(
          "privacy must be one of this values only [public, only_me, friends_only]",
          { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
        );
      }

      if (
        "privacy" in postData &&
        postData.privacy !== "public" &&
        "community" in postData &&
        postData.community !== "personal"
      ) {
        throw new GraphQLError(
          "privacy must be public when posting in community",
          { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while add the post",
        async resolveCallback(user) {
          switch (postData.community) {
            case "group": {
              if (!(await Group.exists({ _id: postData.communityId }))) {
                throw new GraphQLError("group with given id not found", {
                  extensions: { code: "NOT_FOUND" },
                });
              }

              const isMemberOrOwner = (
                [
                  user.joinedGroups,
                  user.ownedGroups,
                ] as unknown as (typeof Types.ObjectId)[]
              ).some((id) => id.toString() === postData.communityId);

              if (!isMemberOrOwner) {
                throw new GraphQLError(
                  "you must be a member in the group to post in it",
                  { extensions: { code: "FORBIDDEN" } }
                );
              }
            }

            case "page": {
              const page = (
                await Page.findById(postData.communityId).select("owner admins")
              )?._doc;

              if (!page) {
                throw new GraphQLError("page not found", {
                  extensions: { code: "NOT_FOUND" },
                });
              }

              const notAdmin = ![page.owner, ...page.admins].some(
                (id) => id.toString() === user._id
              );

              if (notAdmin) {
                throw new GraphQLError("you can't post on this page", {
                  extensions: { code: "FORBIDDEN" },
                });
              }
            }
          }

          const post = await Post.create({
            ...postData,
            privacy:
              postData.community !== "personal" // post in group or page
                ? "public"
                : postData.privacy || "public",
            owner: user._id,
          });

          if (!post) {
            throw new GraphQLError(
              "something went wrong while createing the post",
              {
                extensions: {
                  code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
                },
              }
            );
          }

          const shareDate = Date.now();

          await User.updateOne(
            { _id: user._id },
            {
              $push: {
                allPosts: {
                  post: post._doc._id,
                  shareDate,
                  privacy: post._doc.privacy,
                  community: post._doc.community,
                },
              },
            }
          );

          return {
            ...post._doc,
            owner: JSON.parse(
              JSON.stringify(user, ["_id", "username", "profilePicture"])
            ),
            isShared: false,
            isInBookMark: false,
            shareDate,
          };
        },
      });
    },
    editPost: async (
      _: unknown,
      {
        newPostData: { postId, ...postData },
      }: {
        newPostData: Pick<
          PostType,
          "caption" | "media" | "privacy" | "blockComments"
        > & {
          postId: string;
        };
      },
      { req }: APIContextFnType
    ) => {
      if (!postId) {
        throw new GraphQLError("post id must be provided", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      if (
        !postData.caption &&
        !postData.media &&
        !postData.privacy &&
        !("blockComments" in postData)
      ) {
        throw new GraphQLError("you must provide new data to update the post", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      if (
        "privacy" in postData &&
        !["friends_only", "public", "only_me"].includes(postData.privacy)
      ) {
        throw new GraphQLError(
          "privacy must be on of this values only [public, only_me, friends_only]",
          { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
        );
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while edit the post",
        async resolveCallback(user) {
          const oldPost = (await Post.findById(postId))._doc;

          if (!oldPost) {
            throw new GraphQLError("post with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          if (user._id.toString() !== oldPost.owner.toString()) {
            throw new GraphQLError("post owner only can modify the post", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          // if (oldPost.community === "page") {
          //   const pageData = oldPost.communityId?._doc;

          //   if (!pageData) {
          //     throw new GraphQLError("page info not found", {
          //       extensions: {
          //         code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
          //       },
          //     });
          //   }

          //   const hasAccess = [pageData.owner, ...pageData.admins].some(
          //     (id) => id.toString() === user._id
          //   );

          //   if (!hasAccess) {
          //     throw new GraphQLError(
          //       "you don't have access to edit posts in this page",
          //       {
          //         extensions: { code: "FORBIDDEN" },
          //       }
          //     );
          //   }
          // }

          const newDataKeys = Object.keys(postData).filter(
            (key) => key !== "media"
          );

          for (let i = 0; i < newDataKeys.length; i++) {
            if (
              newDataKeys[i] in postData &&
              oldPost[newDataKeys[i]] ===
                postData[newDataKeys[i] as keyof typeof postData]
            ) {
              throw new GraphQLError(
                `${newDataKeys[i]} can't be the same value`,
                { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
              );
            }
          }

          // { _id: postId, owner: user._id },

          const pushNewMedia: { $push?: { media: ImageType[] } } = {};

          if (postData.media?.length) {
            pushNewMedia.$push = { media: postData.media };
          }

          await Post.updateOne(
            { _id: postId },
            {
              $set: JSON.parse(
                JSON.stringify(postData, [
                  "caption",
                  "privacy",
                  "blockComments",
                ])
              ),
              ...pushNewMedia,
            },
            { new: true }
          );
          // .populate("owner")

          // if (!newPostData) {
          //   throw new GraphQLError(
          //     "something went wrong while updating the post",
          //     {
          //       extensions: {
          //         code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
          //       },
          //     }
          //   );
          // }

          return { message: "post updated successfully" };
        },
      });
    },
    deletePost: async (
      _: unknown,
      { postId }: { postId: string },
      { req }: APIContextFnType
    ) => {
      if (!postId) {
        throw new GraphQLError("post id must be provided", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while deleting the post",
        async resolveCallback(user) {
          const post = (await Post.findById(postId))?._doc;

          if (!post) {
            throw new GraphQLError("post with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          if (post.owner.toString() !== user._id) {
            switch (post.community) {
              case "group": {
                const group = (await Group.findById(post.communityId))?._doc;

                if (!group) {
                  throw new GraphQLError("group not found", {
                    extensions: { code: "FORBIDDEN" },
                  });
                }

                const hasAccess = [...group.admins, group.owner].some(
                  (id: typeof Types.ObjectId) => id.toString() === user._id
                );

                if (!hasAccess) {
                  throw new GraphQLError(
                    "post owner or admins can only delete this post",
                    {
                      extensions: { code: "FORBIDDEN" },
                    }
                  );
                }
              }

              case "page": {
                const page = (await Page.findById(post.communityId))?._doc;

                if (!page) {
                  throw new GraphQLError("page not found", {
                    extensions: { code: "NOT_FOUND" },
                  });
                }

                if (page.owner.toString() !== user._id) {
                  throw new GraphQLError(
                    "post owner or page owner can only delete post",
                    {
                      extensions: { code: "FORBIDDEN" },
                    }
                  );
                }
              }

              default: {
                throw new GraphQLError("you can't delete other users post", {
                  extensions: { code: "FORBIDDEN" },
                });
              }
            }
          }

          await Post.deleteOne({ _id: postId, owner: user._id });

          const deleteCommentsPromise = Comment.deleteMany({ post: postId });

          const deleteFromUsersSavedPostsAndSharedPostsAndPostOwnerPosts =
            User.updateMany(
              {
                $or: [
                  { savedPosts: new Types.ObjectId(postId) },
                  { "allPosts.post": new Types.ObjectId(postId) },
                ],
              },
              {
                $pull: {
                  savedPosts: new Types.ObjectId(postId),
                  allPosts: { post: new Types.ObjectId(postId) },
                },
              }
            );

          await Promise.allSettled([
            deleteFromUsersSavedPostsAndSharedPostsAndPostOwnerPosts,
            deleteCommentsPromise,
            deleteMedia(post.media.map((media: ImageType) => media.public_id)),
          ]);

          return { message: "post deleted successfully" };
        },
      });
    },
    deleteMediaFromPost: async (
      _: unknown,
      {
        mediaData: { itemId: postId, publicIds },
      }: { mediaData: { itemId: string; publicIds: string[] } },
      { req }: APIContextFnType
    ) => {
      if (!postId) {
        throw new GraphQLError("post id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!publicIds?.length) {
        throw new GraphQLError("you must select some media to delete it", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while delete media from post",
        async resolveCallback(user) {
          const oldPost = (await Post.findById(postId))?._doc;

          if (!oldPost) {
            throw new GraphQLError("post with given id not found", {
              extensions: { code: "NOT_FOUND" },
            });
          }

          if (oldPost.owner.toString() !== user._id) {
            throw new GraphQLError("you aren't the post owner", {
              extensions: { code: "FORBIDDEN" },
            });
          }

          await deleteMedia(publicIds);

          await Post.updateOne(
            { _id: postId },
            {
              $pull: {
                media: {
                  $or: publicIds.map((id) => ({ public_id: id })),
                },
              },
            }
          );

          return { message: "media deleted successfully" };
        },
      });
    },
    togglePostFromBookmark: async (
      _: unknown,
      { postId }: { postId: string },
      { req }: APIContextFnType
    ) => {
      if (!postId) {
        throw new GraphQLError("post id must be provided", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      return await handleConnectDB({
        publicErrorMsg: "something went wrong while saving the post",
        req,
        validateToken: true,
        async resolveCallback(user) {
          const post = await checkForPostPrivacy(postId, user._id);
          if (post instanceof GraphQLError) throw post;

          const isPostExistsInUserBookmark = !!post.isInBookMark;

          await User.updateOne(
            { _id: user._id },
            {
              [`$${isPostExistsInUserBookmark ? "pull" : "push"}`]: {
                savedPosts: postId,
              },
            }
          );

          await Post.updateOne(
            { _id: postId },
            {
              $set: {
                isInBookMark: !isPostExistsInUserBookmark,
              },
            }
          );

          return {
            message: `post ${
              isPostExistsInUserBookmark
                ? "removed from you bookmarks"
                : "saved"
            } successfully`,
          };
        },
      });
    },
    toggleReaction: async (
      _: unknown,
      {
        reactionData: { itemId, reaction },
      }: { reactionData: Record<"itemId" | "reaction", keyof ReactionsType> },
      { req }: APIContextFnType
    ) => {
      if (!itemId) {
        throw new GraphQLError("post id is required to add reaction on it", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      if (!reaction) {
        throw new GraphQLError("reaction is required to add it on the post", {
          extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT },
        });
      }

      if (!["like", "love", "sad", "angry"].includes(reaction)) {
        throw new GraphQLError(
          "reaction must be one of these reaction [like, love, sad, angry]",
          { extensions: { code: ApolloServerErrorCode.BAD_USER_INPUT } }
        );
      }

      return await handleConnectDB({
        publicErrorMsg:
          "something went wrong while update reaction to this post",
        req,
        validateToken: true,
        async resolveCallback(user) {
          const oldPost = await checkForPostPrivacy(itemId, user._id);
          if (oldPost instanceof GraphQLError) throw oldPost;

          const oldUserReactionPromise = await Post.aggregate([
            { $match: { _id: new Types.ObjectId(itemId) } },
            {
              $facet: {
                like: [
                  {
                    $project: {
                      like: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.like.users",
                        ],
                      },
                    },
                  },
                  { $match: { like: true } },
                ],
                love: [
                  {
                    $project: {
                      love: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.love.users",
                        ],
                      },
                    },
                  },
                  { $match: { love: true } },
                ],
                sad: [
                  {
                    $project: {
                      sad: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.sad.users",
                        ],
                      },
                    },
                  },
                  { $match: { sad: true } },
                ],
                angry: [
                  {
                    $project: {
                      angry: {
                        $in: [
                          new Types.ObjectId(user._id),
                          "$reactions.angry.users",
                        ],
                      },
                    },
                  },
                  { $match: { angry: true } },
                ],
              },
            },
          ]);

          const oldUserReaction = Object.entries(
            oldUserReactionPromise?.[0]
          ).find(([key, value]) => {
            return !!(value as unknown as Record<string, boolean>[])?.[0]?.[
              key
            ];
          })?.[0];

          const modifyData = {
            $inc: {
              [`reactions.${reaction}.count`]:
                oldUserReaction === reaction ? -1 : 1,
            },

            [`$${oldUserReaction === reaction ? "pull" : "push"}`]: {
              [`reactions.${reaction}.users`]: user._id,
            },
          } as Record<string, unknown>;

          if (oldUserReaction && oldUserReaction !== reaction) {
            modifyData["$inc"] = {
              ...(modifyData["$inc"] as Record<string, unknown>),
              [`reactions.${oldUserReaction}.count`]: -1,
            };

            modifyData["$pull"] = {
              ...(modifyData["$pull"] as Record<string, unknown>),
              [`reactions.${oldUserReaction}.users`]: user._id,
            };
          }

          await Post.updateOne({ _id: itemId }, modifyData);

          if (!oldUserReaction && oldPost.owner._id.toString() !== user._id) {
            const finalReaction = `${reaction}${
              ["love", "like"].includes(reaction) ? "d" : " from"
            }`;

            const notification = {
              icon: reaction,
              content: `${user.username} ${finalReaction} your post`,
              url: `/post/${itemId}`,
            };

            await User.updateOne(
              { _id: oldPost.owner._id },
              {
                $push: {
                  notifications: notification,
                },
              }
            );
          }

          return { message: `reaction updated successfully` };
        },
      });
    },
    toggleSharedPost: async (
      _: unknown,
      { postId }: { postId: string },
      { req }: APIContextFnType
    ) => {
      if (!postId) {
        throw new GraphQLError("post id is required", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }

      return await handleConnectDB({
        req,
        validateToken: true,
        publicErrorMsg: "something went wrong while proccess your order",
        async resolveCallback(user) {
          const post = await checkForPostPrivacy(postId, user._id);
          if (post instanceof GraphQLError) throw post;

          const isPostInMyPostsResponse = await User.aggregate([
            { $match: { _id: new Types.ObjectId(user._id) } },
            {
              $project: {
                isPostInMyPosts: {
                  $in: [new Types.ObjectId(postId), "$allPosts.post"],
                },
              },
            },
          ]);

          const isPostInMyPosts = isPostInMyPostsResponse?.[0]?.isPostInMyPosts;

          const finalSharedPostData = {
            post: postId,
          } as Record<string, unknown>;

          if (!isPostInMyPosts) {
            finalSharedPostData.shareDate = Date.now();
          }

          await User.updateOne(
            { _id: user._id },
            {
              [`$${isPostInMyPosts ? "pull" : "push"}`]: {
                allPosts: finalSharedPostData,
                sharedPosts: postId,
              },
            }
          );

          await Post.updateOne(
            { _id: postId },
            {
              $inc: {
                "shareData.count": isPostInMyPosts ? -1 : 1,
              },
              [`$${isPostInMyPosts ? "pull" : "push"}`]: {
                "shareData.users": user._id,
              },
            }
          );

          if (!isPostInMyPosts) {
            const notification = {
              content: `${user.username} shared your post`,
              icon: "post",
              url: `/post/${postId}`,
            };

            await User.updateOne(
              { _id: post.owner._id },
              {
                $push: { notifications: notification },
              }
            );
          }

          return {
            message: `post ${
              isPostInMyPosts ? "removed from" : "add to"
            } your shared posts successfully`,
          };
        },
      });
    },
  },
};

export default postResolvers;
